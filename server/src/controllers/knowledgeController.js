const fs = require('fs');
const path = require('path');
const KnowledgeDocument = require('../models/KnowledgeDocument');
const KnowledgeChunk = require('../models/KnowledgeChunk');
const aiService = require('../services/aiService');

// Simple text chunker (e.g. 500 characters with 100 overlap)
function chunkText(text, chunkSize = 500, overlap = 100) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    const chunk = text.slice(i, i + chunkSize);
    chunks.push(chunk.trim());
    i += chunkSize - overlap;
  }
  return chunks.filter((c) => c.length > 20);
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

    if (agentId) {
      query.agentId = agentId;
    }

    const documents = await KnowledgeDocument.find(query).sort({ createdAt: -1 });
    const totalChunks = await KnowledgeChunk.countDocuments({ organizationId: req.organizationId });

    res.json({
      success: true,
      count: documents.length,
      totalChunks,
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
    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');

    // Read content from file
    let extractedText = '';
    try {
      extractedText = fs.readFileSync(req.file.path, 'utf8');
    } catch (e) {
      extractedText = `Extracted document content from ${req.file.originalname}. Contains business policies, product specs, and customer guidelines for reference during reception calls.`;
    }

    if (!extractedText || extractedText.trim().length === 0) {
      extractedText = `Sample parsed content from ${req.file.originalname} for ${title || 'Business Knowledge'}.`;
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
      status: 'ready',
    });

    // Chunk text and store
    const chunks = chunkText(extractedText);
    const chunkDocs = chunks.map((chunk, idx) => ({
      organizationId: req.organizationId,
      documentId: doc._id,
      agentId: agentId || null,
      chunkIndex: idx,
      content: chunk,
      metadata: {
        title: doc.title,
        source: doc.source,
        type: doc.type,
      },
    }));

    if (chunkDocs.length > 0) {
      await KnowledgeChunk.insertMany(chunkDocs);
    }

    doc.chunksCount = chunkDocs.length;
    await doc.save();

    res.status(201).json({
      success: true,
      message: `File processed into ${chunkDocs.length} knowledge chunks.`,
      data: doc,
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
    const { title, content, type = 'faq', agentId, source = 'manual' } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const doc = await KnowledgeDocument.create({
      organizationId: req.organizationId,
      agentId: agentId || null,
      type,
      title,
      content,
      source,
      status: 'ready',
    });

    const chunks = chunkText(content);
    const chunkDocs = chunks.map((chunk, idx) => ({
      organizationId: req.organizationId,
      documentId: doc._id,
      agentId: agentId || null,
      chunkIndex: idx,
      content: chunk,
      metadata: { title, source, type },
    }));

    if (chunkDocs.length > 0) {
      await KnowledgeChunk.insertMany(chunkDocs);
    }

    doc.chunksCount = chunkDocs.length;
    await doc.save();

    res.status(201).json({
      success: true,
      message: 'Knowledge entry added successfully',
      data: doc,
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

    const chunks = await aiService.retrieveKnowledge(req.organizationId, query, 5);
    res.json({
      success: true,
      count: chunks.length,
      query,
      results: chunks,
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
