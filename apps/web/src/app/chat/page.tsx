"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Loader2,
  Sparkles,
  Trash2,
  MapPin,
  ChevronLeft,
  Settings,
  Bot,
  User,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { chatWithAI } from "@/lib/api";
import { t } from "@/lib/i18n";
import {
  playError,
  playMessageIn,
  playMicOff,
  playMicOn,
  playSend,
  primeSound,
} from "@/lib/sound";
import Link from "next/link";

// ── Types ───────────────────────────────────────────────────────────────
type Phase = "idle" | "listening" | "thinking" | "speaking" | "error";

interface Message {
  role: "user" | "ai";
  text: string;
  time: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRec = any;

const SPEECH_LANG: Record<string, string> = { hi: "hi-IN", en: "en-IN" };
const TTS_LANG: Record<string, string> = { hi: "hi-IN", en: "en-IN" };

const SUGGESTIONS: Record<string, string[]> = {
  hi: [
    "आज का मौसम कैसा रहेगा?",
    "PM-Kisan योजना क्या है?",
    "धान की खेती कैसे करें?",
    "मिट्टी की जाँच कहाँ कराएं?",
  ],
  en: [
    "How's the weather today?",
    "What is PM-Kisan scheme?",
    "Best way to grow Rice?",
    "Where to test soil?",
  ],
};

function timeNow(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPage() {
  const { lang } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [muted, setMuted] = useState(false);
  const [srSupported, setSrSupported] = useState(true);
  const [interimText, setInterimText] = useState("");

  const recRef = useRef<SpeechRec>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const finalTranscriptRef = useRef<string>("");
  const locationRef = useRef<{ lat: number; lon: number } | null>(null);

  // ── Init Speech ────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setSrSupported(false);
    } else {
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      recRef.current = rec;
    }
    synthRef.current = window.speechSynthesis;
  }, []);

  // ── Fetch GPS on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        locationRef.current = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      },
      () => { /* permission denied – location stays null */ },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // ── Auto-scroll ────────────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, phase, interimText]);

  // ── TTS ────────────────────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (muted || !synthRef.current) return;
    synthRef.current.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = TTS_LANG[lang] ?? "en-IN";
    utt.onstart = () => setPhase("speaking");
    utt.onend = () => setPhase("idle");
    synthRef.current.speak(utt);
  }, [muted, lang]);

  // ── Logic ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || phase === "thinking") return;

    setInput("");
    playSend();
    setMessages(prev => [...prev, { role: "user", text: trimmed, time: timeNow() }]);
    setPhase("thinking");

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, text: m.text }));
      const loc = locationRef.current;
      const reply = await chatWithAI(
        trimmed,
        lang,
        loc ? { lat: loc.lat, lon: loc.lon } : undefined,
        history
      );
      playMessageIn();
      setMessages(prev => [...prev, { role: "ai", text: reply, time: timeNow() }]);
      speak(reply);
      if (phase !== "speaking") setPhase("idle");
    } catch (err) {
      playError();
      setPhase("error");
    }
  }, [messages, lang, phase, speak]);

  const handleMic = useCallback(() => {
    if (!recRef.current || phase === "thinking") return;

    if (phase === "listening") {
      recRef.current.stop();
      return;
    }

    setPhase("listening");
    playMicOn();
    finalTranscriptRef.current = "";
    recRef.current.lang = SPEECH_LANG[lang];
    
    recRef.current.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) finalTranscriptRef.current += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      setInterimText(finalTranscriptRef.current + interim);
    };

    recRef.current.onend = () => {
      const final = (finalTranscriptRef.current || interimText).trim();
      setInterimText("");
      playMicOff();
      if (final) sendMessage(final);
      else setPhase("idle");
    };

    recRef.current.start();
  }, [phase, lang, sendMessage, interimText]);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-black overflow-hidden relative">
      {/* Premium Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gold-500/5 blur-[120px] rounded-full translate-y-1/2" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-emerald-50 dark:border-white/5 backdrop-blur-3xl bg-white/50 dark:bg-black/50">
        <div className="flex items-center gap-4">
          <Link href="/" className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-white/5 flex items-center justify-center text-emerald-950 dark:text-emerald-50 hover:bg-emerald-100 dark:hover:bg-white/10 transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-600/20 flex items-center justify-center">
              <Bot size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-black text-emerald-950 dark:text-emerald-50 leading-tight">KrishiConnect AI</h1>
              <div className="flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">{lang === "hi" ? "ऑनलाइन" : "Online"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setMuted(!muted)} className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-white/5 flex items-center justify-center text-emerald-900 dark:text-emerald-50">
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button onClick={() => setMessages([])} className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-600">
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <main ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-4 py-8 space-y-8 scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-12">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-24 h-24 rounded-[2.5rem] bg-emerald-50 dark:bg-white/5 flex items-center justify-center shadow-inner"
            >
              <Sparkles size={48} className="text-emerald-600" />
            </motion.div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-emerald-950 dark:text-emerald-50 tracking-tighter">
                {lang === "hi" ? "नमस्ते किसान भाई! 🙏" : "Hello, Farmer! 🙏"}
              </h2>
              <p className="text-emerald-900/40 dark:text-emerald-50/40 font-bold uppercase tracking-widest text-xs">
                {lang === "hi" ? "मैं आपकी खेती में कैसे मदद कर सकता हूँ?" : "How can I help with your farming today?"}
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3 max-w-lg">
              {(SUGGESTIONS[lang] || SUGGESTIONS.en).map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="px-6 py-3 rounded-full bg-white dark:bg-white/5 border border-emerald-100 dark:border-white/10 text-sm font-black text-emerald-950 dark:text-emerald-50 hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-95"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-sm mt-1 ${
                  m.role === "user" ? "bg-emerald-950 text-emerald-50" : "bg-emerald-500 text-white"
                }`}>
                  {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`space-y-1.5 ${m.role === "user" ? "text-right" : "text-left"}`}>
                  <div className={`p-5 rounded-[2rem] shadow-sm text-sm font-bold leading-relaxed ${
                    m.role === "user" 
                      ? "bg-emerald-950 text-white rounded-tr-none" 
                      : "bg-white dark:bg-white/5 border border-emerald-50 dark:border-white/5 text-emerald-950 dark:text-emerald-50 rounded-tl-none shadow-emerald-500/5 shadow-xl"
                  }`}>
                    {m.text}
                  </div>
                  <span className="text-[10px] font-black text-emerald-900/20 dark:text-emerald-50/20 uppercase tracking-widest px-2">{m.time}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {phase === "thinking" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
             <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white shrink-0 flex items-center justify-center shadow-sm mt-1">
                  <Bot size={16} />
                </div>
                <div className="bg-white dark:bg-white/5 border border-emerald-50 dark:border-white/5 p-5 rounded-[2rem] rounded-tl-none shadow-xl shadow-emerald-500/5">
                   <div className="flex gap-1.5">
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 rounded-full bg-emerald-500" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 rounded-full bg-emerald-500" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 rounded-full bg-emerald-500" />
                   </div>
                </div>
             </div>
          </motion.div>
        )}
      </main>

      {/* Input Area */}
      <footer className="relative z-20 px-4 pb-8 pt-4 backdrop-blur-3xl bg-white/50 dark:bg-black/50 border-t border-emerald-50 dark:border-white/5">
        <div className="max-w-3xl mx-auto space-y-4">
          <AnimatePresence>
            {phase === "listening" && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] p-4 flex flex-col items-center gap-2 mb-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-900">{lang === "hi" ? "आपकी आवाज़ सुन रहा हूँ..." : "Listening to your voice..."}</span>
                </div>
                <p className="text-sm font-black italic text-emerald-950/60 truncate max-w-full">"{interimText || '...'}"</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-3">
            <button 
              onClick={handleMic} 
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-lg ${
                phase === "listening" ? "bg-red-500 text-white shadow-red-500/20" : "bg-emerald-50 dark:bg-white/5 text-emerald-950 dark:text-emerald-50"
              }`}
            >
              {phase === "listening" ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
                placeholder={lang === "hi" ? "खेती का कोई भी सवाल पूछें..." : "Ask any farming question..."}
                rows={1}
                className="w-full bg-emerald-50/50 dark:bg-white/10 px-6 py-4 rounded-[1.5rem] border-2 border-emerald-100 dark:border-white/10 text-emerald-950 dark:text-emerald-50 font-bold placeholder:text-emerald-950/20 dark:placeholder:text-emerald-50/20 focus:border-emerald-600 focus:bg-white dark:focus:bg-white/20 outline-none transition-all resize-none shadow-inner"
                style={{ maxHeight: 200 }}
                onInput={e => {
                  const t = e.currentTarget;
                  t.style.height = "auto";
                  t.style.height = Math.min(t.scrollHeight, 200) + "px";
                }}
              />
              <button 
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || phase === "thinking"}
                className={`absolute right-2 bottom-2 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all active:scale-90 ${
                  input.trim() ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-emerald-100 text-emerald-300 pointer-events-none"
                }`}
              >
                {phase === "thinking" ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </div>
          
          <p className="text-center text-[9px] font-black uppercase tracking-widest text-emerald-900/20 dark:text-emerald-50/20">
            {lang === "hi" ? "Gemini AI द्वारा संचालित · सटिक और सुरक्षित" : "Powered by Gemini AI · Accurate & Secure"}
          </p>
        </div>
      </footer>
    </div>
  );
}
