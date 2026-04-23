"use client";

/**
 * KrishiConnect AI — Floating Voice Assistant
 *
 * Flow:
 *  1. Farmer presses the floating bubble  →  panel opens
 *  2. Mic button pressed                  →  SpeechRecognition starts (browser)
 *  3. Speech captured                     →  POST /chat (Gemini Flash)
 *  4. AI reply received                   →  text shown + spoken via SpeechSynthesis
 *
 * Fully free:
 *  - Speech-to-Text  : Web Speech API (browser native, free)
 *  - AI              : Gemini 1.5 Flash (15 req/min free tier)
 *  - Text-to-Speech  : Web Speech Synthesis API (browser native, free)
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, X, Volume2, VolumeX, Loader2, Bot } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { chatWithAI } from "@/lib/api";
import { playError, playMessageIn, playMicOff, playMicOn, primeSound } from "@/lib/sound";

// ── Types ───────────────────────────────────────────────────────────────────
type Phase = "idle" | "listening" | "thinking" | "speaking" | "error";

interface Message {
  role: "user" | "ai";
  text: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRec = any;

async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}&zoom=12&addressdetails=1`,
      { headers: { "User-Agent": "KrishiConnect/1.0" } }
    );
    const data = await r.json();
    const addr = data?.address ?? {};
    const primary = addr.village || addr.town || addr.city || addr.hamlet || addr.suburb || "";
    const secondary = addr.district || addr.state_district || addr.state || "";
    const composed = [primary, secondary].filter(Boolean).join(", ");
    return composed || null;
  } catch {
    return null;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const SPEECH_LANG: Record<string, string> = {
  hi: "hi-IN",
  en: "en-IN",
};

const TTS_LANG: Record<string, string> = {
  hi: "hi-IN",
  en: "en-IN",
};

function normalizeSpeechText(text: string): string {
  return (text || "")
    .replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, "")
    .replace(/[\u200D\uFE0F]/g, "")
    .replace(/[•●▪◆▶]/g, " ")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pickBestVoice(voices: SpeechSynthesisVoice[], langCode: string, langKey: string): SpeechSynthesisVoice | null {
  const candidates = voices.filter(v => v.lang === langCode || v.lang.startsWith(langKey));
  if (candidates.length === 0) return null;
  const preferredName = /(Google|Microsoft|Neural|Natural)/i;
  return (
    candidates.find(v => preferredName.test(v.name) && v.localService) ??
    candidates.find(v => preferredName.test(v.name)) ??
    candidates.find(v => v.localService) ??
    candidates[0]
  );
}

const PHASE_LABEL: Record<string, Record<Phase, string>> = {
  hi: {
    idle: "Bolne ke liye mic dabayein",
    listening: "Sun raha hoon...",
    thinking: "Soch raha hoon...",
    speaking: "Bol raha hoon...",
    error: "Kuch gadbad hui, dobara try karein",
  },
  en: {
    idle: "Press mic and speak your farming question",
    listening: "Listening...",
    thinking: "Thinking...",
    speaking: "Speaking...",
    error: "Something went wrong, please try again",
  },
};

// ── Component ────────────────────────────────────────────────────────────────
export default function VoiceAssistant() {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [muted, setMuted] = useState(false);
  const [srSupported, setSrSupported] = useState(true);

  const coordsRef = useRef<{ lat: number; lon: number } | null>(null);
  const locationLabelRef = useRef<string | null>(null);
  const coordsFetchStateRef = useRef<"idle" | "pending" | "done">("idle");

  const recRef = useRef<SpeechRec>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const interimTranscriptRef = useRef("");
  const silenceTimerRef = useRef<number | null>(null);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current !== null) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const scheduleAutoStop = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = window.setTimeout(() => {
      if (recRef.current) {
        try { recRef.current.stop(); } catch { /* ignore */ }
      }
    }, 2800);
  }, [clearSilenceTimer]);

  // ── Init SpeechRecognition ─────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as Record<string, unknown>;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) { setSrSupported(false); return; }

    const rec = new (SR as { new(): SpeechRec })();
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    recRef.current = rec;
    synthRef.current = window.speechSynthesis;
  }, []);

  useEffect(() => {
    return () => {
      clearSilenceTimer();
      try { recRef.current?.abort(); } catch { /* ignore */ }
      synthRef.current?.cancel();
    };
  }, [clearSilenceTimer]);

  // ── Scroll to latest message ───────────────────────────────────────────
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // ── TTS helper ────────────────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (muted || !synthRef.current) { setPhase("idle"); return; }
    const cleaned = normalizeSpeechText(text);
    if (!cleaned) { setPhase("idle"); return; }
    synthRef.current.cancel();
    const utt = new SpeechSynthesisUtterance(cleaned);
    utt.lang = TTS_LANG[lang] ?? "en-IN";
    utt.rate = lang === "hi" ? 0.9 : 0.95;
    utt.pitch = 1.0;
    utt.volume = 1.0;

    // Prefer a native voice for the language
    const voices = synthRef.current.getVoices();
    const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
    const bestVoice = isIOS ? null : pickBestVoice(voices, utt.lang, lang);
    if (bestVoice) utt.voice = bestVoice;
    if (synthRef.current.paused) synthRef.current.resume();

    utt.onend = () => setPhase("idle");
    utt.onerror = () => setPhase("idle");

    setPhase("speaking");
    synthRef.current.speak(utt);
  }, [lang, muted]);

  // ── GPS helper (best-effort; do not block UX) ───────────────────────
  const ensureCoords = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!("geolocation" in navigator)) return;
    if (coordsFetchStateRef.current === "pending") return;

    coordsFetchStateRef.current = "pending";
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        coordsRef.current = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        };
        locationLabelRef.current = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        coordsFetchStateRef.current = "done";
      },
      () => {
        coordsFetchStateRef.current = "done";
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 60_000,
      }
    );
  }, []);

  const getCoordsBestEffort = useCallback(async (waitMs = 2500) => {
    if (typeof window === "undefined") return null;
    if (!("geolocation" in navigator)) return null;

    // If we already have coordinates, use them.
    if (coordsRef.current) return coordsRef.current;

    // Start fetching if we haven't yet.
    if (coordsFetchStateRef.current === "idle") {
      ensureCoords();
    }

    // If a request is in-flight, wait briefly (polling) for it to finish.
    const start = Date.now();
    while (Date.now() - start < waitMs) {
      if (coordsRef.current) return coordsRef.current;
      if (coordsFetchStateRef.current === "done") break;
      await new Promise((r) => setTimeout(r, 80));
    }

    return coordsRef.current;
  }, [ensureCoords]);

  // ── Main flow: listen → transcribe → AI → speak ───────────────────────
  const handleMic = useCallback(() => {
    if (!recRef.current) return;

    if (phase === "listening") {
      playMicOff();
      recRef.current.stop();
      setPhase("idle");
      return;
    }

    if (phase === "speaking") {
      synthRef.current?.cancel();
      setPhase("idle");
      return;
    }

    if (phase !== "idle" && phase !== "error") return;

    // Start listening
    recRef.current.lang = SPEECH_LANG[lang] ?? "hi-IN";
    setPhase("listening");
    interimTranscriptRef.current = "";
    primeSound();
    playMicOn();

    // Kick off GPS fetch in parallel while we listen.
    ensureCoords();

    recRef.current.onresult = async (e: any) => {
      let transcript = "";
      let interim = "";
      try {
        const results = e?.results;
        for (let i = (e?.resultIndex ?? 0); i < (results?.length ?? 0); i++) {
          const res = results?.[i];
          const part = res?.[0]?.transcript;
          if (typeof part !== "string") continue;
          if (res?.isFinal) transcript += `${part} `;
          else interim += part;
        }
      } catch { /* ignore */ }
      interimTranscriptRef.current = interim;
      scheduleAutoStop();
      transcript = transcript.trim();
      if (!transcript) { return; }

      // Add user message immediately so the farmer sees what was heard
      setMessages(prev => [...prev, { role: "user", text: transcript }]);
      setPhase("thinking");

      try {
        const c = await getCoordsBestEffort(2500);
        const reply = await chatWithAI(
          transcript,
          lang as "hi" | "en",
          c ? { lat: c.lat, lon: c.lon, village: locationLabelRef.current ?? undefined } : undefined
        );
        playMessageIn();
        setMessages(prev => [...prev, { role: "ai", text: reply }]);
        speak(reply);
      } catch (err) {
        playError();
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        setMessages(prev => [...prev, {
          role: "ai",
          text: lang === "hi"
            ? `Maafi chahta hoon, kuch gadbad ho gayi: ${errMsg}`
            : `Sorry, something went wrong: ${errMsg}`,
        }]);
        setPhase("error");
      }
    };

    recRef.current.onerror = (e: any) => {
      if (e?.error === "no-speech") {
        clearSilenceTimer();
        setPhase("idle");
        return;
      }
      playError();
      clearSilenceTimer();
      setPhase("error");
    };
    recRef.current.onend = () => {
      clearSilenceTimer();
      setPhase(p => p === "listening" ? "idle" : p);
    };

    try {
      recRef.current.start();
      scheduleAutoStop();
    } catch {
      setPhase("error");
    }
  }, [phase, lang, speak, ensureCoords, getCoordsBestEffort, clearSilenceTimer, scheduleAutoStop]);

  // ── Toggle mute ──────────────────────────────────────────────────
  const toggleMute = () => {
    if (!muted) synthRef.current?.cancel();
    setMuted(m => !m);
  };

  // ── Don't render on SSR (avoid hydration mismatch) ─────────────
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const phaseLabel = PHASE_LABEL[lang]?.[phase] ?? PHASE_LABEL.en[phase];

  const micBusy = phase === "thinking";
  const isListen = phase === "listening";
  const isSpeak = phase === "speaking";

  // ── Render ────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Floating launcher bubble ──────────────────────────── */}
      <button
        type="button"
        aria-label="Open KrishiConnect AI assistant"
        onClick={() => setOpen(o => !o)}
        style={{
          position: "fixed",
          bottom: "5.5rem",    /* above mobile BottomNav (4rem) */
          right: "1rem",
          zIndex: 9000,
          width: 58,
          height: 58,
          borderRadius: "50%",
          background: open
            ? "linear-gradient(135deg,#dc2626,#ef4444)"
            : "linear-gradient(135deg,#15803d,#22c55e)",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
          transition: "all 0.25s",
        }}
        className="sm:bottom-6"
      >
        {open ? <X size={24} /> : <Bot size={26} />}
      </button>

      {/* ── Panel ─────────────────────────────────────────────── */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: "calc(5.5rem + 70px)",
            right: "1rem",
            zIndex: 8999,
            width: "min(360px, calc(100vw - 2rem))",
            background: "#fff",
            borderRadius: 24,
            boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            maxHeight: "65vh",
          }}
          className="sm:bottom-24"
        >
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg,#14532d,#16a34a)",
            padding: "14px 16px 12px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
            <span style={{ fontSize: 22 }}>🌾</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, lineHeight: 1.2 }}>
                KrishiConnect AI
              </div>
              <div style={{ color: "#bbf7d0", fontSize: 11 }}>
                {lang === "hi" ? "Apna sawaal puchein — Hindi ya English mein" : "Ask anything about farming"}
              </div>
            </div>
            <button
              type="button"
              onClick={toggleMute}
              style={{ color: muted ? "#fca5a5" : "#bbf7d0", background: "none", border: "none", cursor: "pointer", paddingRight: 4 }}
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              minHeight: 100,
              maxHeight: "40vh",
            }}
          >
            {messages.length === 0 && (
              <div style={{ textAlign: "center", color: "#6b7280", fontSize: 13, paddingTop: 16 }}>
                <div style={{ fontSize: 36, marginBottom: 6 }}>🤖</div>
                {lang === "hi"
                  ? "Namaste Kisan! Mic dabao aur apna sawaal puchho. Main Hindi aur English dono samajhta hoon."
                  : "Hello Farmer! Press the mic and ask me anything about crops, diseases, weather, or schemes."}
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div style={{
                  maxWidth: "85%",
                  padding: "9px 13px",
                  borderRadius: m.role === "user"
                    ? "18px 18px 4px 18px"
                    : "18px 18px 18px 4px",
                  background: m.role === "user"
                    ? "linear-gradient(135deg,#15803d,#22c55e)"
                    : "#f3f4f6",
                  color: m.role === "user" ? "#fff" : "#1f2937",
                  fontSize: 13.5,
                  lineHeight: 1.55,
                }}>
                  {m.role === "ai" && (
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      🌾 KrishiConnect AI
                    </div>
                  )}
                  {m.text}
                </div>
              </div>
            ))}

            {phase === "thinking" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  background: "#f3f4f6",
                  padding: "9px 13px",
                  borderRadius: "18px 18px 18px 4px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: "#6b7280",
                  fontSize: 13,
                }}>
                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                  {lang === "hi" ? "Soch raha hoon..." : "Thinking..."}
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={{
            borderTop: "1px solid #f3f4f6",
            padding: "12px 16px 14px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            background: "#fafafa",
          }}>
            {/* Status label */}
            <div style={{
              fontSize: 11.5,
              color: phase === "error" ? "#dc2626" : "#6b7280",
              textAlign: "center",
              fontWeight: 500,
              minHeight: 16,
            }}>
              {phaseLabel}
            </div>

            {/* Mic button */}
            <button
              type="button"
              disabled={micBusy || !srSupported}
              onClick={handleMic}
              aria-label={isListen ? "Stop" : "Start speaking"}
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                border: "none",
                cursor: micBusy || !srSupported ? "not-allowed" : "pointer",
                background: isListen
                  ? "linear-gradient(135deg,#dc2626,#ef4444)"
                  : isSpeak
                    ? "linear-gradient(135deg,#2563eb,#60a5fa)"
                    : "linear-gradient(135deg,#15803d,#22c55e)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: isListen
                  ? "0 0 0 6px rgba(239,68,68,0.25)"
                  : "0 4px 14px rgba(22,163,74,0.4)",
                transition: "all 0.2s",
                position: "relative",
                opacity: micBusy || !srSupported ? 0.6 : 1,
              }}
            >
              {micBusy
                ? <Loader2 size={26} style={{ animation: "spin 1s linear infinite" }} />
                : isListen
                  ? <MicOff size={26} />
                  : isSpeak
                    ? <Volume2 size={26} />
                    : <Mic size={26} />}

              {/* Pulsing ring when listening */}
              {isListen && (
                <span style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: "#ef4444",
                  opacity: 0.3,
                  animation: "ping 1s cubic-bezier(0,0,0.2,1) infinite",
                }} />
              )}
            </button>

            {!srSupported && (
              <p style={{ fontSize: 11, color: "#dc2626", textAlign: "center" }}>
                {lang === "hi"
                  ? "Voice input is browser mein supported nahi. Chrome/Edge use karein."
                  : "Voice input not supported. Use Chrome or Edge."}
              </p>
            )}

            {/* Clear conversation */}
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => { setMessages([]); setPhase("idle"); synthRef.current?.cancel(); }}
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                {lang === "hi" ? "Saaf karein" : "Clear conversation"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Spin keyframes */}
      <style>{`
        @keyframes spin  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes ping  { 75%, 100% { transform: scale(2); opacity: 0; } }
      `}</style>
    </>
  );
}
