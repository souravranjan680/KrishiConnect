"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Loader2,
  Sparkles,
  Trash2,
  Bot,
  User,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { chatWithAI } from "@/lib/api";
import { playError, playMessageIn, playMicOff, playMicOn, primeSound } from "@/lib/sound";
import Image from "next/image";

// ── Types ────────────────────────────────────────────────────────────────
type Phase = "idle" | "listening" | "thinking" | "speaking" | "error";

interface Msg {
  role: "user" | "ai";
  text: string;
  time: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRec = any;

const SPEECH_LANG: Record<string, string> = { hi: "hi-IN", en: "en-IN" };
const TTS_LANG: Record<string, string> = { hi: "hi-IN", en: "en-IN" };

const QUICK_PROMPTS: Record<string, string[]> = {
  hi: ["फसल सलाह", "कल का मौसम", "बाज़ार भाव"],
  en: ["Crop Advice", "Weather Forecast", "Mandi Rates"],
};

function timeNow(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function FloatingChatBot() {
  const pathname = usePathname();
  const { lang } = useLanguage();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [muted, setMuted] = useState(false);
  const [unread, setUnread] = useState(0);
  const [interimText, setInterimText] = useState("");

  const recRef = useRef<SpeechRec>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const finalTranscriptRef = useRef<string>("");

  // ── Init Speech ────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      recRef.current = rec;
    }
    synthRef.current = window.speechSynthesis;
  }, []);

  // ── Auto-scroll ────────────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, phase, open]);

  // ── Logic ──────────────────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (muted || !synthRef.current) return;
    synthRef.current.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = TTS_LANG[lang] ?? "en-IN";
    utt.onstart = () => setPhase("speaking");
    utt.onend = () => setPhase("idle");
    synthRef.current.speak(utt);
  }, [muted, lang]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || phase === "thinking") return;

    setInput("");
    setMessages(prev => [...prev, { role: "user", text: trimmed, time: timeNow() }]);
    setPhase("thinking");

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, text: m.text }));
      const reply = await chatWithAI(trimmed, lang, undefined, history);
      playMessageIn();
      setMessages(prev => [...prev, { role: "ai", text: reply, time: timeNow() }]);
      if (!open) setUnread(u => u + 1);
      speak(reply);
      if (phase !== "speaking") setPhase("idle");
    } catch (err) {
      playError();
      setPhase("error");
    }
  }, [messages, lang, phase, speak, open]);

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
      const final = finalTranscriptRef.current.trim();
      setInterimText("");
      playMicOff();
      if (final) sendMessage(final);
      else setPhase("idle");
    };

    recRef.current.start();
  }, [phase, lang, sendMessage]);

  if (pathname === "/chat") return null;

  return (
    <div className="fixed bottom-[104px] sm:bottom-8 right-4 sm:right-6 z-[80] flex flex-col items-end gap-4">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-[350px] sm:w-[400px] h-[550px] max-h-[80vh] flex flex-col bg-white dark:bg-emerald-950 rounded-[2.5rem] shadow-[0_32px_64px_rgba(0,0,0,0.2)] border border-emerald-100 dark:border-white/10 overflow-hidden relative"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Image src="/logo.png" alt="Logo" width={24} height={24} className="invert brightness-0" />
                </div>
                <div>
                   <h3 className="text-sm font-black tracking-tight">KrishiConnect AI</h3>
                   <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Smart Advisor</span>
                   </div>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setMuted(!muted)} className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center transition-colors">
                  {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
                <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Mesh background effect inside chat */}
            <div className="absolute inset-x-0 top-16 bottom-0 z-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_50%_0%,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent" />

            {/* Chat Body */}
            <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
              {messages.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-16 h-16 rounded-[2rem] bg-emerald-50 dark:bg-white/5 flex items-center justify-center text-3xl">🌱</div>
                  <p className="text-xs font-bold text-emerald-900/40 dark:text-emerald-50/40 uppercase tracking-widest leading-relaxed">
                    {lang === "hi" ? "पूछें कुछ भी — मैं आपकी मदद करूँगा" : "Ask anything — I'm here to help"}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {(QUICK_PROMPTS[lang] || QUICK_PROMPTS.en).map(q => (
                      <button key={q} onClick={() => sendMessage(q)} className="px-3 py-2 rounded-xl bg-white dark:bg-white/5 border border-emerald-100 dark:border-white/10 text-[10px] font-black text-emerald-950 dark:text-emerald-50 hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`p-4 rounded-[1.5rem] text-xs font-bold leading-relaxed max-w-[85%] shadow-sm ${
                    m.role === "user" 
                      ? "bg-emerald-950 text-white rounded-tr-none" 
                      : "bg-emerald-50 dark:bg-white/10 text-emerald-950 dark:text-emerald-50 rounded-tl-none border border-emerald-100 dark:border-white/5"
                  }`}>
                    {m.text}
                    <div className={`text-[8px] mt-1.5 uppercase tracking-widest opacity-30 ${m.role === "user" ? "text-right" : "text-left"}`}>{m.time}</div>
                  </div>
                </div>
              ))}

              {phase === "thinking" && (
                <div className="flex justify-start">
                   <div className="p-4 bg-emerald-50 dark:bg-white/10 rounded-[1.5rem] rounded-tl-none border border-emerald-100 dark:border-white/5">
                      <div className="flex gap-1">
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      </div>
                   </div>
                </div>
              )}
            </div>

            {/* Input Footer */}
            <div className="p-4 border-t border-emerald-50 dark:border-white/5 bg-white space-y-3">
              {phase === "listening" && (
                <div className="flex items-center gap-2 mb-2 px-2">
                   <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                   <span className="text-[10px] font-black uppercase text-red-500">{lang === "hi" ? "सुन रहा हूँ..." : "Listening..."}</span>
                   <span className="text-[10px] font-bold text-gray-400 italic truncate flex-1">"{interimText}"</span>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={handleMic} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  phase === "listening" ? "bg-red-500 text-white shadow-lg" : "bg-emerald-50 text-emerald-950"
                }`}>
                  {phase === "listening" ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendMessage(input)}
                    placeholder={lang === "hi" ? "पूछें..." : "Ask..."}
                    className="w-full h-12 px-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-xs font-bold text-emerald-950 outline-none focus:border-emerald-500 transition-all"
                  />
                  <button onClick={() => sendMessage(input)} disabled={!input || phase === "thinking"} className="absolute right-1 top-1 w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-950 text-white active:scale-90 transition-all disabled:opacity-30">
                    {phase === "thinking" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        initial={false}
        animate={open ? { scale: 0.8, rotate: 90, opacity: 0 } : { scale: 1, rotate: 0, opacity: 1 }}
        onClick={() => { setOpen(true); setUnread(0); }}
        className="relative w-16 h-16 rounded-[2rem] bg-emerald-950 shadow-2xl flex items-center justify-center group pointer-events-auto"
      >
        <div className="absolute inset-0 rounded-[2rem] bg-emerald-500/20 blur-xl group-hover:scale-150 transition-transform duration-500" />
        <div className="relative z-10 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:rotate-12 transition-transform">
           <Image src="/logo.png" alt="Logo" width={24} height={24} className="invert brightness-0" />
        </div>
        
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gold-500 text-emerald-950 text-[10px] font-black flex items-center justify-center border-2 border-white">
            {unread}
          </span>
        )}
      </motion.button>
    </div>
  );
}
