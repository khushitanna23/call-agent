import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, PhoneOff, PhoneCall, Volume2, Sparkles, User, Bot, AlertCircle } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import api from '../../api/client';

export const LiveVoiceCallModal = ({ isOpen, onClose, agentName = 'Sarah' }) => {
  const [callActive, setCallActive] = useState(false);
  const [duration, setDuration] = useState(0);
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
        recognition.lang = 'en-US';

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
  }, []);

  const speakText = (text) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;

      utterance.onstart = () => setIsAiSpeaking(true);
      utterance.onend = () => setIsAiSpeaking(false);
      utterance.onerror = () => setIsAiSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } else {
      // Simulate speaking state for 2.5 seconds
      setIsAiSpeaking(true);
      setTimeout(() => setIsAiSpeaking(false), 2500);
    }
  };

  const startCall = async () => {
    setConnectionStatus('connecting');
    setTranscript([]);

    setTimeout(() => {
      setConnectionStatus('connected');
      setCallActive(true);

      const greeting = `Hello! Thank you for calling VEDANCO AI. My name is ${agentName}, your AI Receptionist. How may I assist your business today?`;
      const initialTurn = {
        speaker: 'ai',
        text: greeting,
        time: '00:01',
      };
      setTranscript([initialTurn]);
      speakText(greeting);

      if (recognitionRef.current && !isMuted) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // ignore already started
        }
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

    // Call demo turn endpoint
    try {
      setIsAiSpeaking(true);
      const res = await api.post('/demo/voice-turn', {
        messages: newTranscript.map((t) => ({
          role: t.speaker === 'caller' ? 'user' : 'assistant',
          content: t.text,
        })),
      });

      const aiReply = res.content || `Thank you for sharing that. I would love to help you book a demo consultation.`;
      setTranscript((prev) => [
        ...prev,
        {
          speaker: 'ai',
          text: aiReply,
          time: formatTime(duration + 1),
          tool: res.triggeredTool,
        },
      ]);
      speakText(aiReply);
    } catch (err) {
      const fallback = `I understand! We can set up your AI Receptionist to answer 100% of your incoming calls. Would you like me to book a quick appointment?`;
      setTranscript((prev) => [
        ...prev,
        { speaker: 'ai', text: fallback, time: formatTime(duration + 1) },
      ]);
      speakText(fallback);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl glass-panel rounded-3xl p-6 border border-emerald-500/25 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-emerald-950/60">
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

          <button
            onClick={() => {
              endCall();
              onClose();
            }}
            className="text-gray-400 hover:text-white p-1 rounded-lg"
          >
            ✕
          </button>
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
        <div className="mt-4 pt-3 border-t border-emerald-950/60 flex flex-col gap-3">
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
                placeholder="Type a message or speak into your microphone..."
                value={userInputText}
                onChange={(e) => setUserInputText(e.target.value)}
                className="flex-1 bg-[#08080a] border border-emerald-950/80 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400"
              />
              <Button type="submit" size="sm" variant="secondary">
                Send
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
