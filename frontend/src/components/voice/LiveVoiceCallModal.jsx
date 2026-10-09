import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, PhoneOff, PhoneCall, Volume2, Sparkles, User, Bot, AlertCircle, Globe, Languages } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import api from '../../api/client';

export const LiveVoiceCallModal = ({ isOpen, onClose, agentName = 'Sarah', initialLanguage = 'english' }) => {
  const [callActive, setCallActive] = useState(false);
  const [duration, setDuration] = useState(0);
  const [language, setLanguage] = useState(initialLanguage || 'english'); // 'english' | 'gujarati'
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [userInputText, setUserInputText] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected

  const timerRef = useRef(null);
  const transcriptEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Duration timer
  useEffect(() => {
    if (callActive) {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setDuration(0);
    }
    return () => clearInterval(timerRef.current);
  }, [callActive]);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = language === 'gujarati' ? 'gu-IN' : 'en-US';

        recognition.onresult = (event) => {
          const current = event.resultIndex;
          const transcriptText = event.results[current][0].transcript;
          if (transcriptText.trim()) {
            handleSendUserTurn(transcriptText.trim());
          }
        };

        recognition.onstart = () => setIsUserSpeaking(true);
        recognition.onend = () => setIsUserSpeaking(false);
        recognitionRef.current = recognition;
      }
    }
  }, [language]);

  const speakText = (text, targetLang = language) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.02;
      utterance.lang = targetLang === 'gujarati' ? 'gu-IN' : 'en-US';

      try {
        const voices = window.speechSynthesis.getVoices() || [];
        if (targetLang === 'gujarati') {
          const guVoice = voices.find(
            (v) =>
              v.lang?.includes('gu') ||
              v.lang?.toLowerCase().includes('gu-in') ||
              v.name?.toLowerCase().includes('gujarati') ||
              v.name?.toLowerCase().includes('india')
          );
          if (guVoice) utterance.voice = guVoice;
        } else {
          const enVoice = voices.find(
            (v) =>
              v.lang?.includes('en') &&
              (v.name?.includes('Natural') ||
                v.name?.includes('Google') ||
                v.name?.includes('Samantha') ||
                v.name?.includes('Jenny'))
          );
          if (enVoice) utterance.voice = enVoice;
        }
      } catch (e) {}

      utterance.onstart = () => setIsAiSpeaking(true);
      utterance.onend = () => setIsAiSpeaking(false);
      utterance.onerror = () => setIsAiSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } else {
      setIsAiSpeaking(true);
      setTimeout(() => setIsAiSpeaking(false), 2500);
    }
  };

  const getGreeting = (lang = language) => {
    if (lang === 'gujarati') {
      const displayName = agentName === 'Sarah' ? 'સારાહ' : agentName;
      return `નમસ્તે! VEDANCO AI માં કૉલ કરવા બદલ આભાર. મારું નામ ${displayName} છે, તમારી AI સહાયક. આજે હું તમારા વ્યવસાય માટે કેવી રીતે મદદ કરી શકું?`;
    }
    return `Hello! Thank you for calling VEDANCO AI. My name is ${agentName}, your AI Receptionist. How may I assist your business today?`;
  };

  const handleLanguageChange = (newLang) => {
    if (newLang === language) return;
    setLanguage(newLang);

    if (recognitionRef.current) {
      recognitionRef.current.lang = newLang === 'gujarati' ? 'gu-IN' : 'en-US';
    }

    if (callActive) {
      const ackMsg =
        newLang === 'gujarati'
          ? `ભાષા ગુજરાતીમાં બદલાઈ ગઈ છે. હવે તમે મારી સાથે ગુજરાતીમાં વાત કરી શકો છો! હું તમને કેવી રીતે મદદ કરી શકું?`
          : `Language switched to English. You can now speak or type in English. How may I assist you today?`;

      setTranscript((prev) => [
        ...prev,
        {
          speaker: 'ai',
          text: ackMsg,
          time: formatTime(duration + 1),
          tool: 'languageSwitch',
        },
      ]);
      speakText(ackMsg, newLang);
    }
  };

  const startCall = async () => {
    setConnectionStatus('connecting');
    setTranscript([]);

    setTimeout(() => {
      setConnectionStatus('connected');
      setCallActive(true);

      const greeting = getGreeting(language);
      const initialTurn = {
        speaker: 'ai',
        text: greeting,
        time: '00:01',
      };
      setTranscript([initialTurn]);
      speakText(greeting, language);

      if (recognitionRef.current && !isMuted) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }
    }, 1000);
  };

  const endCall = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setCallActive(false);
    setIsAiSpeaking(false);
    setIsUserSpeaking(false);
    setConnectionStatus('disconnected');
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (recognitionRef.current && callActive) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }
    } else {
      setIsMuted(true);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    }
  };

  const handleSendUserTurn = async (messageText) => {
    const textToSend = messageText || userInputText;
    if (!textToSend.trim()) return;

    setUserInputText('');
    const userTurn = {
      speaker: 'caller',
      text: textToSend,
      time: formatTime(duration),
    };

    const newTranscript = [...transcript, userTurn];
    setTranscript(newTranscript);

    // Call demo turn endpoint with selected language
    try {
      setIsAiSpeaking(true);
      const res = await api.post('/demo/voice-turn', {
        messages: newTranscript.map((t) => ({
          role: t.speaker === 'caller' ? 'user' : 'assistant',
          content: t.text,
        })),
        language: language,
        agentName: agentName,
      });

      const aiReply =
        res?.content ||
        res?.reply ||
        (language === 'gujarati'
          ? `તમારી માહિતી બદલ આભાર! હું તમારા માટે ડેમો કન્સલ્ટેશન શેડ્યૂલ કરવામાં ખુશીથી મદદ કરીશ.`
          : `Thank you for sharing that. I would love to help you book a demo consultation.`);

      setTranscript((prev) => [
        ...prev,
        {
          speaker: 'ai',
          text: aiReply,
          time: formatTime(duration + 1),
          tool: res?.triggeredTool,
        },
      ]);
      speakText(aiReply, language);
    } catch (err) {
      const fallback =
        language === 'gujarati'
          ? `હું સમજી ગઈ! અમે તમારા વ્યવસાય માટે 100% ઇનકમિંગ કોલ અટેન્ડ કરવા માટે AI રિસેપ્શનિસ્ટ સેટ કરી શકીએ છીએ. શું તમે મીટિંગ બુક કરવા માંગો છો?`
          : `I understand! We can set up your AI Receptionist to answer 100% of your incoming calls. Would you like me to book a quick appointment?`;

      setTranscript((prev) => [
        ...prev,
        { speaker: 'ai', text: fallback, time: formatTime(duration + 1) },
      ]);
      speakText(fallback, language);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Quick suggestion chips based on selected language
  const quickPrompts =
    language === 'gujarati'
      ? [
          'એપોઇન્ટમેન્ટ બુક કરો',
          'તમારી સેવાઓ શું છે?',
          'કિંમત અને પ્લાન જણાવો',
          'મેનેજર સાથે વાત કરવી છે',
        ]
      : [
          'Book an appointment',
          'What services do you provide?',
          'How much does it cost?',
          'Connect me to a human',
        ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl glass-panel rounded-3xl p-6 border border-emerald-500/25 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-emerald-950/60 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-glow">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Live AI Receptionist Demo</h3>
                <Badge variant="cyan" size="xs">
                  <Sparkles className="w-3 h-3" /> Voice Simulator
                </Badge>
              </div>
              <p className="text-xs text-gray-400">
                Connected to {agentName} • Browser Web Speech & AI Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dual Language Switcher: English & Gujarati */}
            <div className="flex items-center p-1 rounded-xl bg-[#09090c] border border-emerald-500/30 shadow-inner">
              <button
                type="button"
                onClick={() => handleLanguageChange('english')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  language === 'english'
                    ? 'bg-emerald-500 text-black shadow-md font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Speak & test in English"
              >
                <span>🇺🇸</span>
                <span>English</span>
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('gujarati')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  language === 'gujarati'
                    ? 'bg-emerald-500 text-black shadow-md font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="ગુજરાતીમાં વાત કરો અને ટેસ્ટ કરો"
              >
                <span>🇮🇳</span>
                <span>ગુજરાતી</span>
              </button>
            </div>

            <button
              onClick={() => {
                endCall();
                onClose();
              }}
              className="text-gray-400 hover:text-white p-1 rounded-lg"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Live Call Center Display */}
        <div className="py-6 flex flex-col items-center justify-center text-center">
          {/* Avatar & Pulse Rings */}
          <div className="relative mb-4">
            {callActive && (
              <div
                className={`absolute inset-0 rounded-full transition-all duration-500 ${
                  isAiSpeaking
                    ? 'animate-ping bg-emerald-500/30 scale-125'
                    : isUserSpeaking
                    ? 'animate-ping bg-emerald-400/30 scale-125'
                    : 'bg-transparent'
                }`}
              />
            )}

            <div
              className={`relative w-24 h-24 rounded-full flex items-center justify-center border-2 shadow-xl transition-all duration-300 ${
                isAiSpeaking
                  ? 'border-emerald-400 bg-emerald-500/15 shadow-glow'
                  : isUserSpeaking
                  ? 'border-emerald-400 bg-emerald-500/10'
                  : 'border-emerald-950/80 bg-[#121215]'
              }`}
            >
              <Bot
                className={`w-12 h-12 transition-colors ${
                  isAiSpeaking ? 'text-emerald-400' : 'text-gray-300'
                }`}
              />
            </div>

            {/* Speaking Status Pill */}
            {callActive && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
                {isAiSpeaking ? (
                  <Badge variant="cyan" size="xs">
                    <Volume2 className="w-3 h-3 animate-pulse" /> AI Speaking
                  </Badge>
                ) : isUserSpeaking ? (
                  <Badge variant="emerald" size="xs">
                    <Mic className="w-3 h-3 animate-pulse" /> Listening to you...
                  </Badge>
                ) : (
                  <Badge variant="default" size="xs">
                    Ready
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Connection & Timer Status */}
          <div className="flex items-center gap-3 text-xs mt-2">
            <span className="flex items-center gap-1.5 font-medium text-gray-300">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  connectionStatus === 'connected'
                    ? 'bg-emerald-400 animate-pulse'
                    : connectionStatus === 'connecting'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-gray-600'
                }`}
              />
              {connectionStatus === 'connected'
                ? 'Connected (Demo Mode)'
                : connectionStatus === 'connecting'
                ? 'Connecting...'
                : 'Ready to Call'}
            </span>
            {callActive && (
              <>
                <span className="text-gray-600">•</span>
                <span className="font-mono text-emerald-400 font-semibold">{formatTime(duration)}</span>
              </>
            )}
          </div>
        </div>

        {/* Real-time Conversation Transcript */}
        <div className="flex-1 bg-[#0c0c0e] rounded-2xl p-4 border border-emerald-950/70 overflow-y-auto min-h-[160px] max-h-[220px] flex flex-col gap-3">
          {transcript.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 text-xs">
              <Mic className="w-6 h-6 mb-1 text-gray-600" />
              Press "Start Call" to begin speaking with {agentName}.
            </div>
          ) : (
            transcript.map((item, idx) => (
              <div
                key={idx}
                className={`flex gap-3 max-w-[85%] ${
                  item.speaker === 'caller' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs ${
                    item.speaker === 'caller'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {item.speaker === 'caller' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                    item.speaker === 'caller'
                      ? 'bg-emerald-950/40 text-emerald-100 border border-emerald-500/20 rounded-tr-none'
                      : 'bg-[#121215] text-gray-100 border border-emerald-950/80 rounded-tl-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-[10px] text-gray-400 mb-1 font-mono">
                    <span className="font-semibold text-gray-300">
                      {item.speaker === 'caller' ? 'You' : agentName}
                    </span>
                    <span>{item.time}</span>
                  </div>
                  <p>{item.text}</p>
                </div>
              </div>
            ))
          )}
          <div ref={transcriptEndRef} />
        </div>

        {/* Interactive Controls & Text Fallback */}
        <div className="mt-4 pt-3 border-t border-emerald-950/60 flex flex-col gap-2.5">
          {/* Quick interactive test prompt chips */}
          {callActive && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider shrink-0">
                {language === 'gujarati' ? 'પૂછો:' : 'Ask:'}
              </span>
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendUserTurn(prompt)}
                  className="px-2.5 py-1 rounded-lg bg-[#141418] hover:bg-emerald-500/15 border border-slate-800 hover:border-emerald-500/40 text-[11px] text-gray-300 hover:text-emerald-300 transition whitespace-nowrap shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {callActive && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendUserTurn();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder={
                  language === 'gujarati'
                    ? 'અહીં સંદેશ લખો અથવા માઇકથી બોલો (દા.ત. એપોઇન્ટમેન્ટ બુક કરો)...'
                    : 'Type a message or speak into your microphone...'
                }
                value={userInputText}
                onChange={(e) => setUserInputText(e.target.value)}
                className="flex-1 bg-[#08080a] border border-emerald-950/80 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400"
              />
              <Button type="submit" size="sm" variant="secondary">
                {language === 'gujarati' ? 'મોકલો' : 'Send'}
              </Button>
            </form>
          )}

          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Browser Speech API active. No API keys exposed.</span>
            </div>

            <div className="flex items-center gap-3">
              {callActive ? (
                <>
                  <button
                    onClick={toggleMute}
                    title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                    className={`p-3 rounded-xl border transition ${
                      isMuted
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                        : 'bg-[#121215] border-emerald-950/80 text-gray-300 hover:text-white'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  <Button
                    variant="danger"
                    size="md"
                    icon={PhoneOff}
                    onClick={endCall}
                  >
                    End Call
                  </Button>
                </>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  icon={PhoneCall}
                  onClick={startCall}
                >
                  Start Call
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
