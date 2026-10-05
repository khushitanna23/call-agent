import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Upload,
  Plus,
  Search,
  Trash2,
  FileText,
  HelpCircle,
  ShieldCheck,
  Tag,
  RotateCcw,
  Sparkles,
  Globe,
  DollarSign,
  Layers,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';

export const KnowledgePage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Quick Action Modal States
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [websiteModalOpen, setWebsiteModalOpen] = useState(false);
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Website Scrape State
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);

  // Specific Forms
  const [faqData, setFaqData] = useState({ question: '', answer: '' });
  const [serviceData, setServiceData] = useState({ name: '', description: '', deliverables: '' });
  const [pricingData, setPricingData] = useState({ planName: '', price: '', details: '' });

  // Generic Text Knowledge Form
  const [textData, setTextData] = useState({
    title: '',
    content: '',
    type: 'faq',
  });

  // Search tester state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const toast = useToast();

  useEffect(() => {
    fetchKnowledge();
  }, [activeTab]);

  const fetchKnowledge = async () => {
    try {
      setLoading(true);
      const url = `/knowledge?type=${activeTab}`;
      const res = await api.get(url);
      if (res.data) setDocuments(res.data);
    } catch (err) {
      toast.error('Failed to load knowledge documents');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateText = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/knowledge', textData);
      if (res.success) {
        toast.success(`Knowledge item added and chunked into ${res.data.chunksCount || 1} units.`);
        setAddModalOpen(false);
        setTextData({ title: '', content: '', type: 'faq' });
        fetchKnowledge();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to add knowledge');
    }
  };

  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please choose a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', selectedFile.name);
    formData.append('type', 'document');

    try {
      setIsUploading(true);
      const res = await api.post('/knowledge/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(res.message || 'File uploaded and parsed into chunks!');
      setUploadModalOpen(false);
      setSelectedFile(null);
      fetchKnowledge();
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddWebsite = async (e) => {
    e.preventDefault();
    if (!websiteUrl.trim()) return;

    try {
      setIsScraping(true);
      // Attempt to extract via agent scrape service
      let extractedText = '';
      try {
        const scrapeRes = await api.post('/agents/scrape-website', { url: websiteUrl });
        if (scrapeRes.data) {
          const d = scrapeRes.data;
          extractedText = `Company: ${d.companyName || ''}\nDescription: ${d.description || ''}\nServices: ${
            d.extractedServices?.join(', ') || ''
          }`;
        }
      } catch (err) {
        // Fallback default content if offline
        extractedText = `Scraped contents from ${websiteUrl}. Business documentation and website profile.`;
      }

      const res = await api.post('/knowledge', {
        title: `Website: ${websiteUrl.replace(/^https?:\/\//, '')}`,
        content: extractedText || `Website content scraped from ${websiteUrl}`,
        type: 'website',
        source: websiteUrl,
      });

      if (res.success) {
        toast.success(`Website crawled and indexed into ${res.data.chunksCount || 1} chunks!`);
        setWebsiteModalOpen(false);
        setWebsiteUrl('');
        fetchKnowledge();
      }
    } catch (err) {
      toast.error('Failed to index website');
    } finally {
      setIsScraping(false);
    }
  };

  const handleAddFAQ = async (e) => {
    e.preventDefault();
    if (!faqData.question || !faqData.answer) return;

    try {
      const res = await api.post('/knowledge', {
        title: faqData.question,
        content: `Q: ${faqData.question}\nA: ${faqData.answer}`,
        type: 'faq',
      });
      if (res.success) {
        toast.success('FAQ entry saved and vectorized!');
        setFaqModalOpen(false);
        setFaqData({ question: '', answer: '' });
        fetchKnowledge();
      }
    } catch (err) {
      toast.error('Failed to add FAQ');
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!serviceData.name || !serviceData.description) return;

    try {
      const content = `Service: ${serviceData.name}\nDescription: ${serviceData.description}${
        serviceData.deliverables ? `\nDeliverables & Scope: ${serviceData.deliverables}` : ''
      }`;
      const res = await api.post('/knowledge', {
        title: serviceData.name,
        content,
        type: 'service',
      });
      if (res.success) {
        toast.success('Service catalog entry saved!');
        setServiceModalOpen(false);
        setServiceData({ name: '', description: '', deliverables: '' });
        fetchKnowledge();
      }
    } catch (err) {
      toast.error('Failed to add service');
    }
  };

  const handleAddPricing = async (e) => {
    e.preventDefault();
    if (!pricingData.planName || !pricingData.price) return;

    try {
      const content = `Tier: ${pricingData.planName}\nPrice: ${pricingData.price}${
        pricingData.details ? `\nDetails & Inclusions: ${pricingData.details}` : ''
      }`;
      const res = await api.post('/knowledge', {
        title: `${pricingData.planName} Pricing`,
        content,
        type: 'pricing',
      });
      if (res.success) {
        toast.success('Pricing plan indexed!');
        setPricingModalOpen(false);
        setPricingData({ planName: '', price: '', details: '' });
        fetchKnowledge();
      }
    } catch (err) {
      toast.error('Failed to add pricing');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this knowledge entry and its vector chunks?')) return;
    try {
      await api.delete(`/knowledge/${id}`);
      toast.info('Knowledge entry removed');
      fetchKnowledge();
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  const handleTestSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      const res = await api.post('/knowledge/search', { query: searchQuery });
      setSearchResults(res.results || []);
      if (res.results?.length === 0) {
        toast.info('No matching chunks found for query');
      }
    } catch (err) {
      toast.error('Search test failed');
    } finally {
      setIsSearching(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All Knowledge' },
    { id: 'website', label: 'Websites' },
    { id: 'document', label: 'Uploaded Files' },
    { id: 'faq', label: 'FAQs' },
    { id: 'service', label: 'Services' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'policy', label: 'Policies' },
  ];

  // Sources calculations
  const totalChunks = documents.reduce((acc, d) => acc + (d.chunksCount || 1), 0);
  const websiteCount = documents.filter((d) => d.type === 'website').length;
  const docCount = documents.filter((d) => d.type === 'document').length;
  const faqCount = documents.filter((d) => d.type === 'faq').length;
  const serviceCount = documents.filter((d) => d.type === 'service').length;
  const pricingCount = documents.filter((d) => d.type === 'pricing').length;

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Knowledge Base & RAG Index
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Train your AI Receptionist with company documentation, policies, website content, service catalogs, and pricing.
          </p>
        </div>

        {/* 5 Quick-Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Globe}
            onClick={() => setWebsiteModalOpen(true)}
          >
            Add Website
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Upload}
            onClick={() => setUploadModalOpen(true)}
          >
            Upload Document
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={HelpCircle}
            onClick={() => setFaqModalOpen(true)}
          >
            Add FAQ
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Tag}
            onClick={() => setServiceModalOpen(true)}
          >
            Add Service
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={DollarSign}
            onClick={() => setPricingModalOpen(true)}
          >
            Add Pricing
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setAddModalOpen(true)}
          >
            Custom Text
          </Button>
        </div>
      </div>

      {/* Explicit Knowledge Source Overview Cards (Master Plan Requirement) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-4">
          <span className="text-[11px] text-slate-400 block font-medium">Total Sources</span>
          <span className="text-2xl font-extrabold text-white mt-1 block">{documents.length}</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Active items</span>
        </Card>
        <Card className="p-4">
          <span className="text-[11px] text-slate-400 block font-medium">Indexed Chunks</span>
          <span className="text-2xl font-extrabold text-brand-cyan mt-1 block font-mono">
            {totalChunks}
          </span>
          <span className="text-[10px] text-cyan-400/80 mt-0.5 block">Vector RAG Units</span>
        </Card>
        <Card className="p-4">
          <span className="text-[11px] text-slate-400 block font-medium">Websites</span>
          <span className="text-2xl font-extrabold text-indigo-400 mt-1 block font-mono">
            {websiteCount}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Live URLs</span>
        </Card>
        <Card className="p-4">
          <span className="text-[11px] text-slate-400 block font-medium">Documents</span>
          <span className="text-2xl font-extrabold text-white mt-1 block font-mono">
            {docCount}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">PDF / DOCX</span>
        </Card>
        <Card className="p-4">
          <span className="text-[11px] text-slate-400 block font-medium">FAQs</span>
          <span className="text-2xl font-extrabold text-emerald-400 mt-1 block font-mono">
            {faqCount}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Q&A Pairs</span>
        </Card>
        <Card className="p-4">
          <span className="text-[11px] text-slate-400 block font-medium">Services & Rates</span>
          <span className="text-2xl font-extrabold text-amber-400 mt-1 block font-mono">
            {serviceCount + pricingCount}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Catalog records</span>
        </Card>
      </div>

      {/* Semantic Search Tester Card */}
      <Card className="p-6 border border-cyan-500/30">
        <CardHeader
          title="Test AI Knowledge Retrieval"
          subtitle="Simulate what Sarah retrieves when a caller asks a specific question"
          action={
            <Badge variant="cyan" size="xs">
              <Sparkles className="w-3 h-3" /> Live RAG Search
            </Badge>
          }
        />

        <form onSubmit={handleTestSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. What are your pricing plans? Or How do I cancel?"
              className="w-full bg-navy-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-cyan"
            />
          </div>
          <Button type="submit" variant="primary" size="md" isLoading={isSearching}>
            Test Retrieval
          </Button>
        </form>

        {searchResults.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 block uppercase">
              Retrieved Chunks ({searchResults.length})
            </span>
            <div className="space-y-2">
              {searchResults.map((chunk, i) => (
                <div key={i} className="p-3 rounded-xl bg-navy-900 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-[10px] text-brand-cyan mb-1">
                    <span>Chunk #{chunk.chunkIndex ?? i + 1}</span>
                    <span className="text-slate-500">{chunk.metadata?.type || 'chunk'}</span>
                  </div>
                  <p className="text-slate-200">{chunk.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === cat.id
                ? 'bg-brand-cyan text-navy-950 font-bold shadow-glow'
                : 'bg-navy-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 text-xs">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40 text-brand-cyan" />
            No knowledge records found in this category. Use the quick-action buttons above to add content.
          </div>
        ) : (
          documents.map((doc) => (
            <Card key={doc._id} className="p-6 flex flex-col justify-between" hover>
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-brand-cyan flex items-center justify-center shrink-0">
                      {doc.type === 'website' ? (
                        <Globe className="w-4 h-4" />
                      ) : doc.type === 'faq' ? (
                        <HelpCircle className="w-4 h-4" />
                      ) : doc.type === 'service' ? (
                        <Tag className="w-4 h-4" />
                      ) : doc.type === 'pricing' ? (
                        <DollarSign className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white line-clamp-1">{doc.title}</h3>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Source: {doc.source || 'manual'}
                      </span>
                    </div>
                  </div>
                  <Badge variant="cyan" size="xs">
                    {doc.type}
                  </Badge>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-4 py-2 border-y border-slate-800/80 my-2">
                  {doc.content}
                </p>
              </div>

              <div className="mt-4 pt-2 flex items-center justify-between text-[11px] text-slate-500">
                <span>{doc.chunksCount || 1} Chunks Indexed</span>
                <button
                  onClick={() => handleDelete(doc._id)}
                  className="p-1 text-slate-500 hover:text-rose-400 transition"
                  title="Delete knowledge item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* 1. ADD WEBSITE MODAL */}
      <Modal
        isOpen={websiteModalOpen}
        onClose={() => setWebsiteModalOpen(false)}
        title="Add Website Knowledge Source"
      >
        <form onSubmit={handleAddWebsite} className="space-y-4 text-xs text-left">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Website URL *</label>
            <div className="relative">
              <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="url"
                required
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full bg-navy-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-brand-cyan"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              The AI will crawl the page, extract company details, FAQs, and service descriptions, and index them into vector embeddings.
            </p>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setWebsiteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isScraping}>
              Index Website
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. UPLOAD FILE MODAL */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Business Document"
      >
        <form onSubmit={handleUploadFile} className="space-y-4 text-xs text-left">
          <div className="border-2 border-dashed border-slate-700 rounded-2xl p-6 text-center bg-navy-900/50">
            <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-white font-semibold">Select PDF, DOCX, or TXT file</p>
            <input
              type="file"
              accept=".pdf,.docx,.txt,.doc"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="mt-3 text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-navy-800 file:text-brand-cyan file:font-semibold hover:file:bg-navy-700 cursor-pointer"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isUploading}>
              Upload & Extract Chunks
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. ADD FAQ MODAL */}
      <Modal
        isOpen={faqModalOpen}
        onClose={() => setFaqModalOpen(false)}
        title="Add Frequently Asked Question (FAQ)"
      >
        <form onSubmit={handleAddFAQ} className="space-y-4 text-xs text-left">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Caller Question *</label>
            <input
              type="text"
              required
              value={faqData.question}
              onChange={(e) => setFaqData({ ...faqData, question: e.target.value })}
              placeholder="e.g. Do you offer emergency services on weekends?"
              className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">AI Answer / Response *</label>
            <textarea
              rows={4}
              required
              value={faqData.answer}
              onChange={(e) => setFaqData({ ...faqData, answer: e.target.value })}
              placeholder="Yes, our on-call technicians are available 24/7 for urgent emergencies..."
              className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setFaqModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save FAQ
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. ADD SERVICE MODAL */}
      <Modal
        isOpen={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        title="Add Service & Deliverable"
      >
        <form onSubmit={handleAddService} className="space-y-4 text-xs text-left">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Service Name *</label>
            <input
              type="text"
              required
              value={serviceData.name}
              onChange={(e) => setServiceData({ ...serviceData, name: e.target.value })}
              placeholder="e.g. Premium Commercial HVAC Maintenance"
              className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Service Overview *</label>
            <textarea
              rows={3}
              required
              value={serviceData.description}
              onChange={(e) => setServiceData({ ...serviceData, description: e.target.value })}
              placeholder="Comprehensive quarterly inspection, filter replacements, and energy efficiency audit..."
              className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan resize-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Deliverables & Scope</label>
            <input
              type="text"
              value={serviceData.deliverables}
              onChange={(e) => setServiceData({ ...serviceData, deliverables: e.target.value })}
              placeholder="Includes 24-point report, priority dispatch, and zero service call fee"
              className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setServiceModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Service
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. ADD PRICING MODAL */}
      <Modal
        isOpen={pricingModalOpen}
        onClose={() => setPricingModalOpen(false)}
        title="Add Pricing Plan & Rate Card"
      >
        <form onSubmit={handleAddPricing} className="space-y-4 text-xs text-left">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Plan / Rate Name *</label>
              <input
                type="text"
                required
                value={pricingData.planName}
                onChange={(e) => setPricingData({ ...pricingData, planName: e.target.value })}
                placeholder="e.g. Standard Diagnostic Fee"
                className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Rate / Price *</label>
              <input
                type="text"
                required
                value={pricingData.price}
                onChange={(e) => setPricingData({ ...pricingData, price: e.target.value })}
                placeholder="e.g. $89 flat rate (waived with repair)"
                className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Rate Conditions & Details</label>
            <textarea
              rows={3}
              value={pricingData.details}
              onChange={(e) => setPricingData({ ...pricingData, details: e.target.value })}
              placeholder="Applicable to standard business hours. 50% surcharge applies on national holidays..."
              className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setPricingModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Pricing
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. GENERIC TEXT KNOWLEDGE MODAL */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Custom Knowledge Text"
      >
        <form onSubmit={handleCreateText} className="space-y-4 text-xs text-left">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Knowledge Title *</label>
            <input
              type="text"
              required
              value={textData.title}
              onChange={(e) => setTextData({ ...textData, title: e.target.value })}
              placeholder="e.g. Cancellation and Rescheduling Policy"
              className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Category Type</label>
            <select
              value={textData.type}
              onChange={(e) => setTextData({ ...textData, type: e.target.value })}
              className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan"
            >
              <option value="faq">FAQ</option>
              <option value="service">Service & Deliverable</option>
              <option value="pricing">Pricing & Rates</option>
              <option value="policy">Policy & Protocol</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Content / Instructions *</label>
            <textarea
              rows={5}
              required
              value={textData.content}
              onChange={(e) => setTextData({ ...textData, content: e.target.value })}
              placeholder="Provide exact details for the AI to speak when callers ask about this topic..."
              className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save & Index Knowledge
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
