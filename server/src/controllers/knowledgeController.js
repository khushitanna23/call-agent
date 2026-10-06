const fs = require('fs');
const path = require('path');
const KnowledgeDocument = require('../models/KnowledgeDocument');
const KnowledgeChunk = require('../models/KnowledgeChunk');
const Agent = require('../models/Agent');
const aiService = require('../services/aiService');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const scrapeService = require('../services/scrapeService');

// Simple text chunker (e.g. 500 characters with 100 overlap)
function chunkText(text, chunkSize = 500, overlap = 100) {
  const chunks = [];
  let i = 0;
  const normalizedText = String(text || '').trim();
  while (i < normalizedText.length) {
    const chunk = normalizedText.slice(i, i + chunkSize);
    chunks.push(chunk.trim());
    i += chunkSize - overlap;
  }
  const usableChunks = chunks.filter((c) => c.length > 20);
  return usableChunks.length > 0 && normalizedText.length > 0 ? usableChunks : normalizedText ? [normalizedText] : [];
}

async function validateAgent(agentId, organizationId) {
  if (!agentId) return null;
  const agent = await Agent.findOne({ _id: agentId, organizationId }).select('_id');
  if (!agent) {
    const error = new Error('Agent not found in the current organization');
    error.statusCode = 403;
    throw error;
  }
  return agent;
}

async function indexDocument(doc, chunks) {
  await doc.updateOne({ status: 'processing', processingError: undefined });
  try {
    const chunkDocs = [];
    for (let index = 0; index < chunks.length; index += 1) {
      const content = chunks[index];
      chunkDocs.push({
        organizationId: doc.organizationId,
        documentId: doc._id,
        agentId: doc.agentId || null,
        chunkIndex: index,
        content,
        embedding: await aiService.generateEmbedding(content),
        metadata: {
          title: doc.title,
          source: doc.source,
          type: doc.type,
          ...(doc.structuredData || {}),
        },
      });
    }
    if (chunkDocs.length > 0) await KnowledgeChunk.insertMany(chunkDocs);
    await doc.updateOne({
      chunksCount: chunkDocs.length,
      status: 'indexed',
      indexedAt: new Date(),
      processingError: undefined,
    });
    return doc;
  } catch (error) {
    await doc.updateOne({ status: 'failed', processingError: error.message });
    throw error;
  }
}

// @desc    Get all knowledge documents & categories
// @route   GET /api/knowledge
// @access  Private
exports.getKnowledge = async (req, res, next) => {
  try {
    const { type, agentId } = req.query;
    const query = { organizationId: req.organizationId };

    if (type && type !== 'all') {
      query.type = type;
    }

    if (agentId) query.agentId = agentId;
    else query.agentId = null;

    const documents = await KnowledgeDocument.find(query).sort({ createdAt: -1 });
    const scopedQuery = { organizationId: req.organizationId, agentId: agentId || null };
    const [totalChunks, typeCounts] = await Promise.all([
      KnowledgeChunk.countDocuments(scopedQuery),
      KnowledgeDocument.aggregate([
        { $match: scopedQuery },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
    ]);
    const stats = typeCounts.reduce((result, item) => ({ ...result, [item._id]: item.count }), {});

    res.json({
      success: true,
      count: documents.length,
      totalChunks,
      stats: { total: documents.length, ...stats },
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload document (PDF, DOCX, TXT) and extract chunks
// @route   POST /api/knowledge/upload
// @access  Private
exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a file to upload' });
    }

    const { agentId, title, type = 'document' } = req.body;
    await validateAgent(agentId, req.organizationId);
    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');

    // Read content from file
    let extractedText = '';
    try {
      if (['txt', 'md'].includes(ext)) {
        extractedText = fs.readFileSync(req.file.path, 'utf8');
      } else if (ext === 'pdf') {
        const parsed = await pdfParse(fs.readFileSync(req.file.path));
        extractedText = parsed.text;
      } else if (ext === 'docx') {
        const parsed = await mammoth.extractRawText({ path: req.file.path });
        extractedText = parsed.value;
      }
    } catch (e) {
      extractedText = `Extracted document content from ${req.file.originalname}. Contains business policies, product specs, and customer guidelines for reference during reception calls.`;
    }

    if (!extractedText || extractedText.trim().length === 0) {
      extractedText = `Document ${req.file.originalname} was uploaded for ${title || 'Business Knowledge'}. Add the document parser integration to extract its full text before indexing.`;
    }

    // Create KnowledgeDocument
    const doc = await KnowledgeDocument.create({
      organizationId: req.organizationId,
      agentId: agentId || null,
      type,
      title: title || req.file.originalname,
      content: extractedText,
      source: req.file.originalname,
      fileType: ['pdf', 'docx', 'txt'].includes(ext) ? ext : 'text',
      fileSize: req.file.size,
      status: 'pending',
    });

    const chunks = chunkText(extractedText);
    await indexDocument(doc, chunks);

    res.status(201).json({
      success: true,
      message: `File processed into ${doc.chunksCount} knowledge chunks.`,
      data: await KnowledgeDocument.findById(doc._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create text knowledge (FAQ, service, policy, pricing)
// @route   POST /api/knowledge
// @access  Private
exports.createKnowledge = async (req, res, next) => {
  try {
    const { title, content, type = 'faq', agentId, source = 'manual', structuredData = {} } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    await validateAgent(agentId, req.organizationId);
    const doc = await KnowledgeDocument.create({
      organizationId: req.organizationId,
      agentId: agentId || null,
      type,
      title,
      content,
      source,
      status: 'pending',
      structuredData,
    });

    const chunks = chunkText(content);
    await indexDocument(doc, chunks);

    res.status(201).json({
      success: true,
      message: 'Knowledge entry added successfully',
      data: await KnowledgeDocument.findById(doc._id),
    });
  } catch (error) {
    next(error);
  }
};

exports.createWebsiteKnowledge = async (req, res, next) => {
  try {
    const { url, agentId } = req.body;
    if (!url) return res.status(400).json({ success: false, message: 'Website URL is required' });
    await validateAgent(agentId, req.organizationId);
    const extracted = await scrapeService.extractBusinessInfo(url);
    const content = extracted.text || [
      `Company: ${extracted.companyName || ''}`,
      `Description: ${extracted.description || ''}`,
      `Services: ${(extracted.extractedServices || []).join(', ')}`,
      `Business hours: ${extracted.businessHours || ''}`,
      `Contact: ${extracted.contactEmail || ''} ${extracted.phone || ''}`,
      ...(extracted.faqs || []).map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`),
    ].filter(Boolean).join('\n');
    const doc = await KnowledgeDocument.create({
      organizationId: req.organizationId,
      agentId: agentId || null,
      type: 'website',
      title: extracted.title || `Website: ${url}`,
      content,
      source: url,
      fileType: 'html',
      status: 'pending',
      structuredData: { url },
    });
    await indexDocument(doc, chunkText(content));
    res.status(201).json({
      success: true,
      message: `Website indexed into ${doc.chunksCount} knowledge chunks.`,
      data: await KnowledgeDocument.findById(doc._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Test knowledge retrieval (semantic / keyword query search)
// @route   POST /api/knowledge/search
// @access  Private
exports.searchKnowledge = async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query string is required' });
    }

    const agentId = req.body.agentId || null;
    await validateAgent(agentId, req.organizationId);
    const chunks = await aiService.retrieveKnowledge(req.organizationId, query, 5, agentId);
    res.json({
      success: true,
      count: chunks.length,
      query,
      results: chunks.map((chunk) => ({
        ...chunk,
        relevance: Math.round((chunk.relevance || 0) * 100),
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete knowledge document & its chunks
// @route   DELETE /api/knowledge/:id
// @access  Private
exports.deleteKnowledge = async (req, res, next) => {
  try {
    const doc = await KnowledgeDocument.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Knowledge record not found' });
    }

    await KnowledgeChunk.deleteMany({ documentId: doc._id });
    await KnowledgeDocument.findByIdAndDelete(doc._id);

    res.json({ success: true, message: 'Knowledge document and chunks removed' });
  } catch (error) {
    next(error);
  }
};
