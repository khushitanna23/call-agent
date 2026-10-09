import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bot,
  Globe,
  Upload,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Volume2,
  VolumeX,
  Square,
  FileText,
  Building,
  Check,
  PhoneCall,
  Send,
  Loader2,
  AlertCircle,
  HelpCircle,
  Tag,
  DollarSign,
  Trash2,
  RotateCcw,
  PhoneForwarded,
  Calendar,
  UserCheck,
  Phone,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';

export const CreateAgentWizardPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLiveSuccess, setIsLiveSuccess] = useState(false);

  // Modals in Step 5
  const [addKnowledgeModal, setAddKnowledgeModal] = useState({ isOpen: false, type: 'faq' });
  const [tempKnowledge, setTempKnowledge] = useState({ name: '', content: '' });

  // Form State
  const [agentData, setAgentData] = useState({
    name: 'Sarah',
    type: 'receptionist',
    industry: 'Real Estate',
    language: 'english',
    voice: {
      gender: 'Female',
      style: 'Friendly',
      voiceId: '21m00Tcm4TlvDq8ikWAM',
    },
    websiteUrl: 'https://example.com',
    businessName: 'Vedanco Real Estate Group',
    businessDescription: 'Full-service luxury residential and commercial property advisory.',
    personality:
      'Warm, articulate, highly attentive, and proactive. Speaks with a professional cadence, acknowledges customer requests clearly, and guides them effortlessly toward scheduling, qualification, or human handoff.',
    systemInstructions:
      'You are the AI Receptionist for the business. Greet callers warmly, answer questions based on business knowledge, qualify leads, and offer to book appointments.',
    greetingMessage:
      'Hello! Thank you for calling. My name is Sarah, your AI Receptionist. How may I assist you today?',
    actions: {
      answerCalls: true,
      captureLeads: true,
      qualifyLeads: true,
      bookAppointments: true,
      transferCalls: true,
      sendFollowup: true,
    },
    transferSettings: {
      targetPhoneNumber: '+1 (555) 789-0123',
      transferMessage: 'Please hold while I connect you with our specialist team.',
    },
    knowledgeItems: [
      {
        name: 'Website Documentation',
        type: 'Website',
        status: 'Indexed',
        date: 'Today',
        content: 'Overview of luxury listings, client booking protocols, and commission structures.',
      },
      {
        name: 'Office Operating Hours FAQ',
        type: 'FAQs',
        status: 'Indexed',
        date: 'Today',
        content: 'Monday through Saturday 8:00 AM to 7:00 PM EST.',
      },
    ],
  });

  // Step 7: Test Conversation Sandbox & Dual-Language state
  const [sandboxLanguage, setSandboxLanguage] = useState('english'); // 'english' | 'gujarati'
  const [isSpeakingMessageIdx, setIsSpeakingMessageIdx] = useState(null);
  const [autoSpeakReplies, setAutoSpeakReplies] = useState(true); // Setting: whatever chatbot writes, speak it out completely!
  const currentUtteranceRef = useRef(null);
  const speechKeepAliveRef = useRef(null);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (speechKeepAliveRef.current) clearInterval(speechKeepAliveRef.current);
        try {
          window.speechSynthesis.cancel();
        } catch (e) {}
      }
    };
  }, []);

  const [sandboxMessages, setSandboxMessages] = useState([
    {
      role: 'user',
      content: 'Hi, I want to know about your services.',
    },
    {
      role: 'assistant',
      content: "Sure! I'd be happy to help. We provide full-service property advisory, consultations, and verified market valuations. Are you looking to buy, lease, or schedule a tour?",
    },
  ]);
  const [inputTestMessage, setInputTestMessage] = useState('');

  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/admin') ? '/admin' : '/client';

  // Exactly matching Feature 1 Step 2
  const industries = [
    'Real Estate',
    'Healthcare',
    'Hotel',
    'Restaurant',
    'Automobile',
    'Education',
    'Home Services',
    'Other',
  ];

  const voiceStyles = ['Friendly', 'Professional', 'Luxury', 'Energetic'];

  // Handle Business Website Scraping / Extraction (Mock/Demo ready)
  const handleScrapeWebsite = async () => {
    if (!agentData.websiteUrl) {
      toast.error('Please enter a website URL first');
      return;
    }

    try {
      setIsScraping(true);
      const res = await api.post('/agents/scrape-website', { url: agentData.websiteUrl }).catch(() => null);
      if (res?.data) {
        const d = res.data;
        setAgentData((prev) => ({
          ...prev,
          businessName: d.companyName || prev.businessName,
          businessDescription: d.description || prev.businessDescription,
          systemInstructions: d.suggestedSystemInstructions || prev.systemInstructions,
          greetingMessage: d.suggestedGreeting || prev.greetingMessage,
        }));
        toast.success(`Successfully imported business profile for ${d.companyName || 'website'}!`);
      } else {
        toast.success('Website profile information imported successfully!');
      }
    } catch (err) {
      toast.info('Business profile loaded in demo mode');
    } finally {
      setIsScraping(false);
    }
  };

  // Step 5: Add Knowledge item
  const handleSaveKnowledgeItem = (e) => {
    e.preventDefault();
    if (!tempKnowledge.name) return;

    setAgentData((prev) => ({
      ...prev,
      knowledgeItems: [
        ...prev.knowledgeItems,
        {
          name: tempKnowledge.name,
          type: addKnowledgeModal.type,
          status: 'Indexed',
          date: 'Just now',
          content: tempKnowledge.content || `${addKnowledgeModal.type} knowledge record`,
        },
      ],
    }));

    toast.success(`${addKnowledgeModal.type} item added!`);
    setAddKnowledgeModal({ isOpen: false, type: 'faq' });
    setTempKnowledge({ name: '', content: '' });
  };

  const handleDeleteKnowledgeItem = (idx) => {
    setAgentData((prev) => ({
      ...prev,
      knowledgeItems: prev.knowledgeItems.filter((_, i) => i !== idx),
    }));
    toast.info('Knowledge entry removed');
  };

  // Step 7: Dual-Language Test AI in Sandbox with Full Auto-Speech Engine
  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (speechKeepAliveRef.current) {
        clearInterval(speechKeepAliveRef.current);
        speechKeepAliveRef.current = null;
      }
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    setIsSpeakingMessageIdx(null);
  };

  const speakSandboxMessage = (text, lang = sandboxLanguage, messageIdx = null) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (!text || !String(text).trim()) return;

    const cleanText = String(text).trim();

    // If currently speaking this message, clicking again toggles it off
    if (isSpeakingMessageIdx === messageIdx && messageIdx !== null) {
      stopSpeaking();
      return;
    }

    stopSpeaking();

    // Small delay ensures browser cancels any pending audio before starting new utterance
    setTimeout(() => {
      try {
        window.speechSynthesis.resume();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 0.95; // Crisp natural cadence
        utterance.pitch = 1.0;
        utterance.lang = lang === 'gujarati' ? 'gu-IN' : 'en-US';

        const voices = window.speechSynthesis.getVoices() || [];
        if (lang === 'gujarati') {
          let voice = voices.find(
            (v) =>
              v.lang?.toLowerCase().startsWith('gu') ||
              v.name?.toLowerCase().includes('gujarati')
          );
          if (!voice) {
            voice = voices.find(
              (v) =>
                v.lang?.toLowerCase().includes('hi') ||
                v.lang?.toLowerCase().includes('in') ||
                v.name?.toLowerCase().includes('india')
            );
          }
          if (voice) utterance.voice = voice;
        } else {
          const enVoice = voices.find(
            (v) =>
              v.lang?.toLowerCase().startsWith('en') &&
              (v.name?.includes('Natural') ||
                v.name?.includes('Google') ||
                v.name?.includes('Samantha') ||
                v.name?.includes('Jenny'))
          );
          if (enVoice) utterance.voice = enVoice;
        }

        utterance.onstart = () => {
          setIsSpeakingMessageIdx(messageIdx);
        };
        utterance.onend = () => {
          setIsSpeakingMessageIdx(null);
          if (speechKeepAliveRef.current) {
            clearInterval(speechKeepAliveRef.current);
            speechKeepAliveRef.current = null;
          }
        };
        utterance.onerror = () => {
          setIsSpeakingMessageIdx(null);
          if (speechKeepAliveRef.current) {
            clearInterval(speechKeepAliveRef.current);
            speechKeepAliveRef.current = null;
          }
        };

        // Chromium Keep-Alive loop prevents Chrome from cutting off after 15 seconds
        if (speechKeepAliveRef.current) clearInterval(speechKeepAliveRef.current);
        speechKeepAliveRef.current = setInterval(() => {
          if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          } else {
            if (speechKeepAliveRef.current) {
              clearInterval(speechKeepAliveRef.current);
              speechKeepAliveRef.current = null;
            }
          }
        }, 8000);

        // Retain reference globally to protect from Chrome Garbage Collection bug
        currentUtteranceRef.current = utterance;
        window.__activeAgentUtterance = utterance;

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis error:', err);
        setIsSpeakingMessageIdx(null);
      }
    }, 50);
  };

  const handleSandboxLanguageChange = (newLang) => {
    stopSpeaking();
    setSandboxLanguage(newLang);
    let greetingText = '';
    if (newLang === 'gujarati') {
      greetingText = `ચોક્કસ! મને તમને મદદ કરવામાં આનંદ થશે. અમે ${agentData.businessName || agentData.name} માટે સંપૂર્ણ બિઝનેસ કન્સલ્ટેશન, ગ્રાહક પૂછપરછ અને એપોઇન્ટમેન્ટ બુકિંગ સેવાઓ આપીએ છીએ. શું તમે વધુ માહિતી મેળવવા અથવા મુલાકાત શેડ્યૂલ કરવા માંગો છો?`;
      setSandboxMessages([
        {
          role: 'user',
          content: 'નમસ્તે, મારે તમારી સેવાઓ વિશે માહિતી જોઈએ છે.',
        },
        {
          role: 'assistant',
          content: greetingText,
        },
      ]);
    } else {
      greetingText = `Sure! I'd be happy to help. We provide full-service property advisory, consultations, and verified market valuations for ${agentData.businessName || agentData.name}. Are you looking to buy, lease, or schedule a tour?`;
      setSandboxMessages([
        {
          role: 'user',
          content: 'Hi, I want to know about your services.',
        },
        {
          role: 'assistant',
          content: greetingText,
        },
      ]);
    }

    if (autoSpeakReplies) {
      speakSandboxMessage(greetingText, newLang, 1);
    }
  };

  const handleTestMessage = async (e, customText) => {
    e?.preventDefault();
    const textToSend = customText || inputTestMessage;
    if (!textToSend.trim()) return;

    const userMsg = { role: 'user', content: textToSend };
    const updatedMessages = [...sandboxMessages, userMsg];
    setSandboxMessages(updatedMessages);
    setInputTestMessage('');

    try {
      setIsTesting(true);
      const res = await api.post('/agents/sandbox/test', {
        messages: updatedMessages,
        agentName: agentData.name,
        industry: agentData.industry,
        personality: agentData.personality,
        systemInstructions: agentData.systemInstructions,
        actions: agentData.actions,
        language: sandboxLanguage,
      }).catch(() => null);

      let replyContent = res?.data?.content || res?.reply;
      const isGu = sandboxLanguage === 'gujarati';

      if (!replyContent) {
        const lower = textToSend.toLowerCase();
        if (isGu) {
          if (
            lower.includes('એપોઇન્ટમેન્ટ') ||
            lower.includes('બુક') ||
            lower.includes('સમય') ||
            lower.includes('તારીખ') ||
            lower.includes('મળવું')
          ) {
            replyContent = `હું તમારી એપોઇન્ટમેન્ટ બુક કરવામાં ચોક્કસ મદદ કરી શકું! અમારી પાસે આવતીકાલે સવારે 10:00 વાગ્યે અથવા બપોરે 2:30 વાગ્યે સ્લોટ ઉપલબ્ધ છે. તમને કયો સમય અનુકૂળ રહેશે?`;
          } else if (
            lower.includes('કિંમત') ||
            lower.includes('ભાવ') ||
            lower.includes('પ્લાન') ||
            lower.includes('રૂપિયા') ||
            lower.includes('ખર્ચ')
          ) {
            replyContent = `અમારા પ્લાન દર મહિને ફક્ત $99 થી શરૂ થાય છે જેમાં 300 મિનિટ મળે છે. શું તમે તમારા વ્યવસાય માટે પ્લાન વિગતો જાણવા માંગો છો?`;
          } else if (
            lower.includes('મેનેજર') ||
            lower.includes('માણસ') ||
            lower.includes('વાત') ||
            lower.includes('કનેક્ટ')
          ) {
            replyContent = `ચોક્કસ, હું તમારો કોલ અમારા સિનિયર મેનેજર સાથે ટ્રાન્સફર કરી રહી છું. કૃપા કરીને થોડીવાર લાઇન પર રહો.`;
          } else {
            replyContent = `પૂછવા બદલ આભાર! ${agentData.businessName || agentData.name} ની AI સહાયક તરીકે, હું તમારી પૂછપરછમાં મદદ કરી શકું છું અથવા અમારા એક્સપર્ટ સાથે કન્સલ્ટેશન શેડ્યૂલ કરી શકું છું.`;
          }
        } else {
          if (
            lower.includes('appointment') ||
            lower.includes('book') ||
            lower.includes('schedule') ||
            lower.includes('time')
          ) {
            replyContent = `I would be delighted to schedule a consultation with our team! I have available slots tomorrow at 10:00 AM or 2:30 PM. Which time works best for you?`;
          } else if (
            lower.includes('price') ||
            lower.includes('cost') ||
            lower.includes('plan')
          ) {
            replyContent = `Our starter plans begin at $99/month with 300 included voice minutes. Would you like me to share more details?`;
          } else {
            replyContent = `Thank you for asking! As the AI Receptionist for ${agentData.businessName || agentData.name}, I can assist you with that or schedule a consultation directly with our team.`;
          }
        }
      }

      const assistantMsg = {
        role: 'assistant',
        content: replyContent,
        tool: res?.data?.triggeredTool,
      };

      setSandboxMessages((prev) => [...prev, assistantMsg]);

      // AUTO-SPEAK: Speaks out complete message when AI writes in chatbot!
      if (autoSpeakReplies) {
        speakSandboxMessage(replyContent, sandboxLanguage, updatedMessages.length);
      }
    } catch (err) {
      const fallback =
        sandboxLanguage === 'gujarati'
          ? `હું ${agentData.industry} સેવાઓ માટે તમારી સહાયતા કરવા તૈયાર છું. શું તમે એપોઇન્ટમેન્ટ બુક કરવા માંગો છો?`
          : `I would be happy to help with your inquiry regarding ${agentData.industry} services. Would you like to schedule an appointment?`;

      setSandboxMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: fallback,
        },
      ]);

      if (autoSpeakReplies) {
        speakSandboxMessage(fallback, sandboxLanguage, updatedMessages.length);
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearConversation = () => {
    handleSandboxLanguageChange(sandboxLanguage);
    toast.info('Test conversation cleared');
  };

  // Step 8: Save and Go Live (Feature 4 requirement: updates UI/demo state, shows success)
  const handleGoLive = async () => {
    try {
      setIsSubmitting(true);
      await api.post('/agents', agentData).catch(() => null);
      setIsLiveSuccess(true);
      toast.success(`🎉 ${agentData.name} is now LIVE!`);
    } catch (err) {
      setIsLiveSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    'Name',
    'Industry',
    'Voice',
    'Website',
    'Knowledge',
    'Actions',
    'Test AI',
    'Go Live',
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
      {/* Wizard Header */}
      <div className="text-center">
        <Badge variant="cyan" size="sm" className="mb-2">
          Step {currentStep} of 8
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Create &amp; Train Your AI Employee
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Follow the 8-step wizard to personalize, train, and activate your automated employee.
        </p>

        {/* Step Indicator Tracker */}
        <div className="mt-6 flex items-center justify-between gap-1 overflow-x-auto pb-2">
          {steps.map((label, idx) => {
            const stepNum = idx + 1;
            const isDone = currentStep > stepNum;
            const isCurrent = currentStep === stepNum;
            return (
              <div
                key={idx}
                className="flex items-center gap-1.5 shrink-0 cursor-pointer"
                onClick={() => isDone && setCurrentStep(stepNum)}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                    isDone
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isCurrent
                      ? 'bg-emerald-500 text-black font-extrabold shadow-glow'
                      : 'bg-[#121215] text-gray-400 border border-emerald-950/80'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : stepNum}
                </div>
                <span
                  className={`hidden sm:inline text-[11px] font-semibold ${
                    isCurrent ? 'text-white font-bold' : 'text-gray-500'
                  }`}
                >
                  {label}
                </span>
                {idx < steps.length - 1 && (
                  <div className="hidden sm:block w-4 h-[1px] bg-emerald-950/80 mx-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Wizard Form Card */}
      <Card className="p-6 sm:p-10 border border-slate-800 shadow-2xl relative">
        {/* STEP 1: Name Your AI (Preserved exactly) */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h3 className="text-xl font-bold text-white">STEP 1 — Name</h3>
              <p className="text-xs text-slate-400 mt-1">
                Choose a warm, approachable name your callers will hear when they dial in.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                AI Employee Name *
              </label>
              <input
                type="text"
                required
                value={agentData.name}
                onChange={(e) => setAgentData({ ...agentData, name: e.target.value })}
                placeholder="e.g. Sarah"
                className="w-full bg-navy-900 border border-slate-700 rounded-xl px-4 py-3 text-base text-white focus:outline-none focus:border-brand-cyan shadow-inner"
              />
              <span className="text-[11px] text-slate-500 mt-1.5 block">
                Popular employee names: Sarah, Rachel, Chloe, Michael, Jessica.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Custom Welcome Greeting
              </label>
              <textarea
                rows={3}
                value={agentData.greetingMessage}
                onChange={(e) => setAgentData({ ...agentData, greetingMessage: e.target.value })}
                className="w-full bg-navy-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-cyan resize-none"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Industry (Feature 1 Requirement) */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h3 className="text-xl font-bold text-white">STEP 2 — Industry</h3>
              <p className="text-xs text-slate-400 mt-1">
                Select your industry to prime the AI with specialized domain vocabulary and protocols.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {industries.map((ind) => (
                <button
                  key={ind}
                  type="button"
                  onClick={() => setAgentData({ ...agentData, industry: ind })}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    agentData.industry === ind
                      ? 'bg-gradient-to-r from-brand-cyan/20 to-brand-indigo/20 border-cyan-500 text-white shadow-glow'
                      : 'bg-navy-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <Building className="w-5 h-5 text-brand-cyan mb-2" />
                  <span className="text-sm font-bold block">{ind}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Domain optimized</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Voice (Feature 1 Requirement) */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h3 className="text-xl font-bold text-white">STEP 3 — Voice</h3>
              <p className="text-xs text-slate-400 mt-1">
                Select gender and voice style for human-grade telephone presence (UI preview only).
              </p>
            </div>

            {/* Gender: Female, Male */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Gender</label>
              <div className="grid grid-cols-2 gap-4">
                {['Female', 'Male'].map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() =>
                      setAgentData({
                        ...agentData,
                        voice: { ...agentData.voice, gender },
                      })
                    }
                    className={`p-4 rounded-2xl border text-center transition-all ${
                      agentData.voice.gender === gender
                        ? 'bg-brand-cyan/15 border-brand-cyan text-white shadow-glow'
                        : 'bg-navy-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-sm font-bold">{gender}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Style: Friendly, Professional, Luxury, Energetic */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Voice Style</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {voiceStyles.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() =>
                      setAgentData({
                        ...agentData,
                        voice: { ...agentData.voice, style },
                      })
                    }
                    className={`p-4 rounded-2xl border text-center transition-all ${
                      agentData.voice.style === style
                        ? 'bg-brand-indigo/20 border-brand-indigo text-white shadow-glow-indigo'
                        : 'bg-navy-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Volume2 className="w-5 h-5 mx-auto mb-1.5 text-brand-cyan" />
                    <span className="text-xs font-bold block">{style}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Conversational Language: English vs Gujarati */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Primary Conversational Language *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    id: 'english',
                    label: 'English',
                    flag: '🇺🇸',
                    sub: 'Native US / Global English conversational speech',
                  },
                  {
                    id: 'gujarati',
                    label: 'ગુજરાતી (Gujarati)',
                    flag: '🇮🇳',
                    sub: 'શુદ્ધ ગુજરાતી પ્રાદેશિક વૉઇસ અને વાતચીત',
                  },
                ].map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => {
                      const nextLang = lang.id;
                      setAgentData({
                        ...agentData,
                        language: nextLang,
                        greetingMessage:
                          nextLang === 'gujarati'
                            ? `નમસ્તે! ${agentData.businessName || 'અમારી કંપની'} માં કૉલ કરવા બદલ આભાર. મારું નામ ${agentData.name} છે, તમારી AI રિસેપ્શનિસ્ટ. આજે હું તમારી શું સેવા કરી શકું?`
                            : `Hello! Thank you for calling ${agentData.businessName || 'our company'}. My name is ${agentData.name}, your AI Receptionist. How may I assist you today?`,
                      });
                      handleSandboxLanguageChange(nextLang);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      (agentData.language || 'english') === lang.id
                        ? 'bg-brand-cyan/15 border-brand-cyan text-white shadow-glow'
                        : 'bg-navy-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{lang.flag}</span>
                      <span className="text-sm font-bold text-white">{lang.label}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block">{lang.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Business Website (Feature 1 Requirement) */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h3 className="text-xl font-bold text-white">STEP 4 — Business Website</h3>
              <p className="text-xs text-slate-400 mt-1">
                Provide your company website and profile details for automated knowledge synthesis.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Business Website URL *
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="url"
                      value={agentData.websiteUrl}
                      onChange={(e) => setAgentData({ ...agentData, websiteUrl: e.target.value })}
                      placeholder="https://yourcompany.com"
                      className="w-full bg-navy-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-cyan"
                    />
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    isLoading={isScraping}
                    onClick={handleScrapeWebsite}
                  >
                    Import Business Info
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={agentData.businessName}
                  onChange={(e) => setAgentData({ ...agentData, businessName: e.target.value })}
                  placeholder="e.g. Acme Corporation"
                  className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-cyan"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Business Description
                </label>
                <textarea
                  rows={3}
                  value={agentData.businessDescription}
                  onChange={(e) => setAgentData({ ...agentData, businessDescription: e.target.value })}
                  placeholder="Describe your company services, core deliverables, and target market..."
                  className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-cyan resize-none"
                />
              </div>
            </div>

            <div className="bg-navy-900/60 p-4 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-2">
              <span className="font-semibold text-white block">Automated Information Extraction:</span>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> Company overview &amp; service catalog
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> Operating business hours &amp; contact coordinates
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> Frequently Asked Questions (FAQs)
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Knowledge (Feature 1 Requirement) */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h3 className="text-xl font-bold text-white">STEP 5 — Knowledge</h3>
              <p className="text-xs text-slate-400 mt-1">
                Train Sarah with company documentation, services, pricing, and FAQs.
              </p>
            </div>

            {/* Quick Action Buttons: Add Website, Upload PDF, Upload DOCX, Add FAQ, Add Service, Add Pricing */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={Globe}
                onClick={() => setAddKnowledgeModal({ isOpen: true, type: 'Website' })}
              >
                Add Website
              </Button>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 bg-transparent hover:bg-white/5 text-slate-300 cursor-pointer transition">
                <Upload className="w-3.5 h-3.5 text-brand-cyan" /> Upload PDF
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      const f = e.target.files[0];
                      setAgentData((prev) => ({
                        ...prev,
                        knowledgeItems: [
                          ...prev.knowledgeItems,
                          {
                            name: f.name,
                            type: 'Documents (PDF)',
                            status: 'Indexed',
                            date: 'Just now',
                            content: `Parsed document: ${f.name}`,
                          },
                        ],
                      }));
                      toast.success(`Uploaded "${f.name}" to knowledge!`);
                    }
                  }}
                />
              </label>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 bg-transparent hover:bg-white/5 text-slate-300 cursor-pointer transition">
                <Upload className="w-3.5 h-3.5 text-brand-cyan" /> Upload DOCX
                <input
                  type="file"
                  accept=".docx,.doc"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      const f = e.target.files[0];
                      setAgentData((prev) => ({
                        ...prev,
                        knowledgeItems: [
                          ...prev.knowledgeItems,
                          {
                            name: f.name,
                            type: 'Documents (DOCX)',
                            status: 'Indexed',
                            date: 'Just now',
                            content: `Parsed Word file: ${f.name}`,
                          },
                        ],
                      }));
                      toast.success(`Uploaded "${f.name}" to knowledge!`);
                    }
                  }}
                />
              </label>
              <Button
                variant="outline"
                size="sm"
                icon={HelpCircle}
                onClick={() => setAddKnowledgeModal({ isOpen: true, type: 'FAQs' })}
              >
                Add FAQ
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={Tag}
                onClick={() => setAddKnowledgeModal({ isOpen: true, type: 'Services' })}
              >
                Add Service
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={DollarSign}
                onClick={() => setAddKnowledgeModal({ isOpen: true, type: 'Pricing' })}
              >
                Add Pricing
              </Button>
            </div>

            {/* Knowledge Items Table showing: Name, Type, Status, Date, Actions */}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-navy-900 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Last Updated</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {agentData.knowledgeItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No knowledge items added yet. Click an option above to train Sarah.
                      </td>
                    </tr>
                  ) : (
                    agentData.knowledgeItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02] transition">
                        <td className="py-3 px-4 font-semibold text-white">{item.name}</td>
                        <td className="py-3 px-4">
                          <Badge variant="cyan" size="xs">
                            {item.type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="emerald" size="xs">
                            {item.status || 'Indexed'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{item.date || 'Today'}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteKnowledgeItem(idx)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STEP 6: AI ACTIONS (Feature 3 Requirement) */}
        {currentStep === 6 && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h3 className="text-xl font-bold text-white">STEP 6 — AI ACTIONS</h3>
              <p className="text-xs text-slate-400 mt-1">
                Enable or disable operational capabilities your AI Employee is authorized to perform autonomously.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  key: 'answerCalls',
                  icon: PhoneCall,
                  title: 'Answer Calls',
                  desc: 'Pick up inbound customer phone calls 24/7 on the very first ring.',
                },
                {
                  key: 'captureLeads',
                  icon: UserCheck,
                  title: 'Capture Leads',
                  desc: 'Automatically collect customer information during conversations.',
                },
                {
                  key: 'qualifyLeads',
                  icon: Sparkles,
                  title: 'Qualify Leads',
                  desc: 'Score caller budget, urgency, and operational requirements.',
                },
                {
                  key: 'bookAppointments',
                  icon: Calendar,
                  title: 'Book Appointments',
                  desc: 'Check live calendar availability and schedule consultations directly.',
                },
                {
                  key: 'transferCalls',
                  icon: PhoneForwarded,
                  title: 'Transfer Calls',
                  desc: 'Execute warm handoffs to senior human representatives on request.',
                },
                {
                  key: 'sendFollowup',
                  icon: Send,
                  title: 'Send Follow-up',
                  desc: 'Dispatch instant SMS confirmations, email receipts, and brochures.',
                },
              ].map((act) => {
                const Icon = act.icon;
                const isEnabled = agentData.actions[act.key];
                return (
                  <label
                    key={act.key}
                    className={`p-4 rounded-2xl border flex items-start gap-3.5 cursor-pointer transition ${
                      isEnabled
                        ? 'bg-cyan-500/10 border-cyan-500/40 text-white shadow-glow-sm'
                        : 'bg-navy-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                        isEnabled
                          ? 'bg-cyan-500/20 text-brand-cyan border-cyan-500/30'
                          : 'bg-navy-800 text-slate-500 border-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{act.title}</span>
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={(e) =>
                            setAgentData({
                              ...agentData,
                              actions: { ...agentData.actions, [act.key]: e.target.checked },
                            })
                          }
                          className="accent-brand-cyan w-4 h-4 rounded cursor-pointer"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{act.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            {agentData.actions.transferCalls && (
              <div className="p-4 rounded-2xl bg-navy-900 border border-slate-800 mt-4">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Human Escalation Phone Number
                </label>
                <input
                  type="tel"
                  value={agentData.transferSettings.targetPhoneNumber}
                  onChange={(e) =>
                    setAgentData({
                      ...agentData,
                      transferSettings: {
                        ...agentData.transferSettings,
                        targetPhoneNumber: e.target.value,
                      },
                    })
                  }
                  placeholder="+1 (555) 789-0123"
                  className="w-full bg-navy-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-brand-cyan"
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 7: TEST AI (Feature 4 Requirement - Dual Language English & Gujarati) */}
        {currentStep === 7 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-xl font-bold text-white">STEP 7 — TEST AI</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Test Conversation simulation with your configured AI employee before deployment.
                </p>
              </div>

              {/* Language Switcher, Auto-Voice Setting & Audio Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Auto-Voice Toggle Setting */}
                <button
                  type="button"
                  onClick={() => {
                    const next = !autoSpeakReplies;
                    setAutoSpeakReplies(next);
                    if (!next) stopSpeaking();
                    toast.info(
                      next
                        ? (sandboxLanguage === 'gujarati' ? '🔊 ઓટો-અવાજ ચાલુ: AI જે લખશે તે બોલશે' : '🔊 Auto-Voice ON: AI will speak replies completely')
                        : (sandboxLanguage === 'gujarati' ? '🔇 અવાજ બંધ કર્યો' : '🔇 Auto-Voice Muted')
                    );
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
                    autoSpeakReplies
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                      : 'bg-navy-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                  title={sandboxLanguage === 'gujarati' ? 'સ્વચાલિત અવાજ સેટિંગ: AI ચેટબોટમાં લખે ત્યારે આપમેળે બોલશે' : 'Toggle auto-speak when AI types a response'}
                >
                  {autoSpeakReplies ? (
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>
                    {autoSpeakReplies
                      ? (sandboxLanguage === 'gujarati' ? '🔊 અવાજ: ચાલુ' : '🔊 Voice: ON')
                      : (sandboxLanguage === 'gujarati' ? '🔇 અવાજ: બંધ' : '🔇 Voice: OFF')}
                  </span>
                </button>

                {/* Stop button when actively speaking */}
                {isSpeakingMessageIdx !== null && (
                  <button
                    type="button"
                    onClick={stopSpeaking}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 hover:bg-rose-500/30 transition animate-pulse"
                    title={sandboxLanguage === 'gujarati' ? 'બોલવાનું બંધ કરો' : 'Stop speaking'}
                  >
                    <Square className="w-3 h-3 fill-rose-400" />
                    <span>{sandboxLanguage === 'gujarati' ? 'અવાજ રોકો' : 'Stop Voice'}</span>
                  </button>
                )}

                {/* Dual Language Switcher */}
                <div className="flex items-center p-1 rounded-xl bg-navy-950 border border-slate-800 shadow-inner">
                  <button
                    type="button"
                    onClick={() => handleSandboxLanguageChange('english')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                      sandboxLanguage === 'english'
                        ? 'bg-emerald-500 text-black shadow-md font-bold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span>🇺🇸</span>
                    <span>English</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSandboxLanguageChange('gujarati')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                      sandboxLanguage === 'gujarati'
                        ? 'bg-emerald-500 text-black shadow-md font-bold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span>🇮🇳</span>
                    <span>ગુજરાતી</span>
                  </button>
                </div>

                <Badge variant="emerald" size="sm">
                  <Sparkles className="w-3 h-3" /> Ready to Test
                </Badge>
              </div>
            </div>

            {/* Auto-Speech Active Notification Banner */}
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-navy-950 border border-emerald-500/20 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <span className="flex h-2.5 w-2.5 relative">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                      autoSpeakReplies ? 'bg-emerald-400' : 'bg-slate-500'
                    } opacity-75`}
                  ></span>
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      autoSpeakReplies ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  ></span>
                </span>
                <span className="font-medium">
                  {sandboxLanguage === 'gujarati'
                    ? (autoSpeakReplies
                        ? '💡 AI ચેટબોટમાં જે કંઈ પણ લખશે, તે આખેઆખું સ્પષ્ટ અવાજમાં બોલશે (Auto-Voice સક્રિય છે)'
                        : '🔇 અવાજ બંધ છે. AI ફક્ત ચેટબોટમાં લખશે. સાંભળવા માટે "🔊 અવાજ: ચાલુ" કરો.')
                    : (autoSpeakReplies
                        ? '💡 Whatever the AI writes in the chatbot, it will speak out completely aloud (Auto-Voice Active)'
                        : '🔇 Voice is muted. AI will only type. Click "🔊 Voice: ON" above to enable auto-speech.')}
                </span>
              </div>
              <span className="text-[11px] text-emerald-400 font-bold hidden sm:inline-block">
                {sandboxLanguage === 'gujarati' ? '🇮🇳 ગુજરાતી ભાષણ (Speech)' : '🇺🇸 English Speech'}
              </span>
            </div>

            {/* AI Employee Information Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-2xl bg-navy-900 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">AI Employee</span>
                <span className="font-bold text-white mt-0.5 block">{agentData.name}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Industry</span>
                <span className="font-bold text-brand-cyan mt-0.5 block">{agentData.industry}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Voice</span>
                <span className="font-bold text-slate-200 mt-0.5 block">
                  {agentData.voice.gender} • {agentData.voice.style}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Test Language</span>
                <span className="font-bold text-emerald-400 mt-0.5 block flex items-center gap-1">
                  <span>{sandboxLanguage === 'gujarati' ? '🇮🇳' : '🇺🇸'}</span>
                  <span>{sandboxLanguage === 'gujarati' ? 'ગુજરાતી' : 'English'}</span>
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Auto-Voice Setting</span>
                <span className="font-bold mt-0.5 block text-emerald-400">
                  {autoSpeakReplies ? '🔊 ON (બોલશે)' : '🔇 OFF (બંધ)'}
                </span>
              </div>
            </div>

            {/* Test Conversation Area */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Test Conversation</span>
                  <span className="text-[11px] font-normal text-slate-400">
                    ({sandboxLanguage === 'gujarati' ? 'ગુજરાતી મોડ' : 'English Mode'})
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  {isSpeakingMessageIdx !== null && (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 animate-pulse font-medium">
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{sandboxLanguage === 'gujarati' ? 'અવાજ ચાલે છે...' : 'Speaking now...'}</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleClearConversation}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition"
                  >
                    <RotateCcw className="w-3 h-3" /> Clear
                  </button>
                </div>
              </div>

              <div className="bg-navy-900/90 rounded-2xl p-4 border border-slate-800 h-64 overflow-y-auto space-y-3">
                {sandboxMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 max-w-[85%] ${
                      msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs ${
                        msg.role === 'user'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-cyan-500/20 text-brand-cyan'
                      }`}
                    >
                      {msg.role === 'user' ? 'Customer' : <Bot className="w-4 h-4" />}
                    </div>
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-emerald-950/40 text-emerald-100 border border-emerald-500/20'
                          : 'bg-navy-800 text-slate-100 border border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-semibold text-slate-400 block">
                          {msg.role === 'user' ? 'Customer:' : `${agentData.name} (AI):`}
                        </span>
                        {msg.role === 'assistant' && (
                          <button
                            type="button"
                            onClick={() => speakSandboxMessage(msg.content, sandboxLanguage, i)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1.5 transition ${
                              isSpeakingMessageIdx === i
                                ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/30 animate-pulse'
                                : 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30'
                            }`}
                            title={sandboxLanguage === 'gujarati' ? 'આખો મેસેજ સાંભળો' : 'Listen to full message aloud'}
                          >
                            <Volume2 className={`w-3.5 h-3.5 ${isSpeakingMessageIdx === i ? 'text-black' : 'text-emerald-400'}`} />
                            <span>
                              {isSpeakingMessageIdx === i
                                ? (sandboxLanguage === 'gujarati' ? '🔊 બોલે છે...' : '🔊 Speaking...')
                                : (sandboxLanguage === 'gujarati' ? '🔊 સાંભળો' : '🔊 Listen')}
                            </span>
                          </button>
                        )}
                      </div>
                      <p>{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Test Prompt Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider shrink-0">
                {sandboxLanguage === 'gujarati' ? 'ઝડપી પ્રશ્ન:' : 'Quick Test:'}
              </span>
              {(sandboxLanguage === 'gujarati'
                ? [
                    'સેવાઓ વિશે જણાવો',
                    'એપોઇન્ટમેન્ટ બુક કરવી છે',
                    'ઓફિસનો સમય શું છે?',
                    'કિંમત કેટલી છે?',
                  ]
                : [
                    'Tell me about your services',
                    'I want to book an appointment',
                    'What are your hours?',
                    'What is the pricing?',
                  ]
              ).map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleTestMessage(null, chip)}
                  className="px-2.5 py-1 rounded-lg bg-navy-900 hover:bg-emerald-500/15 border border-slate-800 hover:border-emerald-500/40 text-[11px] text-slate-300 hover:text-emerald-300 transition whitespace-nowrap shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Message input + Send button */}
            <form onSubmit={handleTestMessage} className="flex gap-2">
              <input
                type="text"
                value={inputTestMessage}
                onChange={(e) => setInputTestMessage(e.target.value)}
                placeholder={
                  sandboxLanguage === 'gujarati'
                    ? 'ગ્રાહકનો પ્રશ્ન લખો: દા.ત. તમારી સેવાઓ શું છે? શું હું એપોઇન્ટમેન્ટ બુક કરી શકું?'
                    : 'Type customer message: e.g. What are your hours? Can I book a tour?'
                }
                className="flex-1 bg-navy-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-cyan"
              />
              <Button type="submit" variant="primary" size="md" isLoading={isTesting}>
                <Send className="w-4 h-4" /> {sandboxLanguage === 'gujarati' ? 'મોકલો' : 'Send'}
              </Button>
            </form>
          </div>
        )}

        {/* STEP 8: GO LIVE (Feature 4 Requirement) */}
        {currentStep === 8 && (
          <div className="space-y-6 animate-in fade-in py-4">
            {!isLiveSuccess ? (
              <>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-cyan to-brand-indigo text-white flex items-center justify-center mx-auto shadow-glow mb-3">
                    <Sparkles className="w-9 h-9" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Your AI Employee is Ready</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Review your configuration summary before activating 24/7 reception.
                  </p>
                </div>

                {/* Configuration Summary */}
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-left text-xs space-y-3 max-w-lg mx-auto">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-400">AI Employee:</span>
                    <span className="font-bold text-white">{agentData.name}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-400">Industry:</span>
                    <span className="font-bold text-brand-cyan">{agentData.industry}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-400">Voice:</span>
                    <span className="font-bold text-white">
                      {agentData.voice.gender} • {agentData.voice.style}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-400">Knowledge:</span>
                    <span className="font-bold text-slate-200">
                      {agentData.knowledgeItems.length} Verified Sources
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Enabled Actions:</span>
                    <span className="text-emerald-400 font-semibold">
                      {Object.values(agentData.actions).filter(Boolean).length} Active Actions
                    </span>
                  </div>
                </div>

                {/* Readiness Checklist */}
                <div className="max-w-lg mx-auto p-4 rounded-2xl bg-navy-900 border border-slate-800 text-left text-xs space-y-2">
                  <span className="font-bold text-white block mb-1">Deployment Checklist:</span>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> AI configured
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> Knowledge added
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> Actions configured
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> Test completed
                  </div>
                </div>

                <div className="text-center pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    isLoading={isSubmitting}
                    onClick={handleGoLive}
                    className="px-8 py-3.5 text-base shadow-glow"
                  >
                    Go Live
                  </Button>
                </div>
              </>
            ) : (
              /* Success State: AI Employee is Live */
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-glow">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div>
                  <h3 className="text-2xl font-extrabold text-white">Your AI Employee is Live</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    {agentData.name} has been activated in demo mode and is ready to process calls 24/7.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-navy-900 border border-slate-800 text-xs max-w-md mx-auto space-y-2 text-left">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Active Agent:</span>
                    <span className="font-bold text-white">{agentData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assigned Inbound Line:</span>
                    <span className="font-mono text-brand-cyan font-bold">+1 (800) 555-0199</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <Badge variant="emerald" size="xs">
                      ONLINE
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => navigate(`${basePath}/agents`)}
                  >
                    View All Agents
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => navigate(`${basePath}/dashboard`)}
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Wizard Footer Navigation Controls */}
        {!isLiveSuccess && (
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between">
            {currentStep > 1 ? (
              <Button
                variant="secondary"
                size="md"
                icon={ArrowLeft}
                onClick={() => setCurrentStep((prev) => prev - 1)}
              >
                Previous
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 8 ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => setCurrentStep((prev) => prev + 1)}
              >
                Continue <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : null}
          </div>
        )}
      </Card>

      {/* Step 5 Add Knowledge Modal */}
      <Modal
        isOpen={addKnowledgeModal.isOpen}
        onClose={() => setAddKnowledgeModal({ isOpen: false, type: 'faq' })}
        title={`Add ${addKnowledgeModal.type} Entry`}
      >
        <form onSubmit={handleSaveKnowledgeItem} className="space-y-4 text-xs text-left">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              {addKnowledgeModal.type === 'Website'
                ? 'Website URL *'
                : addKnowledgeModal.type === 'FAQs'
                ? 'Question *'
                : addKnowledgeModal.type === 'Services'
                ? 'Service Title *'
                : 'Plan / Rate Name *'}
            </label>
            <input
              type="text"
              required
              value={tempKnowledge.name}
              onChange={(e) => setTempKnowledge({ ...tempKnowledge, name: e.target.value })}
              placeholder={
                addKnowledgeModal.type === 'Website'
                  ? 'https://example.com/pricing'
                  : addKnowledgeModal.type === 'FAQs'
                  ? 'Do you offer weekend appointments?'
                  : addKnowledgeModal.type === 'Services'
                  ? 'Commercial Advisory Service'
                  : 'Diagnostic Rate Card'
              }
              className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              {addKnowledgeModal.type === 'FAQs'
                ? 'Answer Details *'
                : addKnowledgeModal.type === 'Pricing'
                ? 'Pricing Details & Terms *'
                : 'Description / Instructions'}
            </label>
            <textarea
              rows={4}
              value={tempKnowledge.content}
              onChange={(e) => setTempKnowledge({ ...tempKnowledge, content: e.target.value })}
              placeholder="Provide exact information for the AI to speak when callers ask..."
              className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAddKnowledgeModal({ isOpen: false, type: 'faq' })}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Entry
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
