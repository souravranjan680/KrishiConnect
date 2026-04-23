"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff } from "lucide-react";
import type { Language } from "@/lib/types";
import { playError, playMicOff, playMicOn, primeSound } from "@/lib/sound";

/** Maps our Language to BCP-47 speech recognition locale */
const SPEECH_LANG: Record<Language, string> = {
  hi: "hi-IN",
  en: "en-IN",
};

type Props = {
  lang: Language;
  onResult: (transcript: string) => void;
  className?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRec = any;

export default function VoiceInput({ lang, onResult, className = "" }: Props) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);
  const recRef = useRef<SpeechRec>(null);
  const transcriptRef = useRef("");
  const interimRef = useRef("");
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
      try { recRef.current?.stop(); } catch { /* ignore */ }
    }, 2800);
  }, [clearSilenceTimer]);

  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new (SR as { new(): SpeechRec })();
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    recRef.current = rec;

    rec.onresult = (e: any) => {
      // Some browsers return multiple result chunks; prefer final results.
      let transcript = "";
      try {
        const results = e?.results;
        const start = typeof e?.resultIndex === "number" ? e.resultIndex : 0;
        if (results && typeof results.length === "number") {
          for (let i = start; i < results.length; i++) {
            const r = results[i];
            const alt = r?.[0];
            const part = alt?.transcript;
            if (r?.isFinal === false) continue;
            if (typeof part === "string" && part.trim()) transcript += `${part} `;
          }
        }
      } catch {
        // ignore
      }
      if (transcript) transcriptRef.current += transcript;
      try {
        const results = e?.results;
        if (results && typeof results.length === "number") {
          const latest = results[results.length - 1];
          if (latest?.isFinal === false) interimRef.current = String(latest?.[0]?.transcript ?? "");
        }
      } catch {
        // ignore
      }
      scheduleAutoStop();
    };
    rec.onerror = (ev: any) => {
      setLastError(ev?.error ? String(ev.error) : "unknown");
      playError();
      clearSilenceTimer();
      setListening(false);
    };
    rec.onend = () => {
      clearSilenceTimer();
      const finalText = `${transcriptRef.current} ${interimRef.current}`.trim();
      transcriptRef.current = "";
      interimRef.current = "";
      if (finalText) onResult(finalText);
      setListening(false);
    };

    return () => {
      clearSilenceTimer();
      try { rec.abort(); } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearSilenceTimer, onResult, scheduleAutoStop]);

  useEffect(() => {
    if (recRef.current) recRef.current.lang = SPEECH_LANG[lang];
  }, [lang]);

  const toggle = useCallback(() => {
    if (!recRef.current) return;
    if (listening) {
      clearSilenceTimer();
      playMicOff();
      try {
        recRef.current.stop();
        setListening(false);
      } catch {
        setLastError("stop-failed");
        setListening(false);
      }
    } else {
      setLastError(null);
      transcriptRef.current = "";
      interimRef.current = "";
      primeSound();
      playMicOn();
      recRef.current.lang = SPEECH_LANG[lang];
      try {
        recRef.current.start();
        setListening(true);
        scheduleAutoStop();
      } catch {
        playError();
        setLastError("start-failed");
        setListening(false);
      }
    }
  }, [listening, lang, clearSilenceTimer, scheduleAutoStop]);

  if (!supported) {
    return (
      <button
        type="button"
        disabled
        aria-label="Voice input not supported"
        className={`relative flex items-center justify-center rounded-2xl ${className}`}
        style={{
          width: 52,
          height: 52,
          minWidth: 52,
          background: "#9ca3af",
          color: "#fff",
          opacity: 0.7,
        }}
        title="Voice input not supported in this browser"
      >
        <MicOff size={22} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={listening ? "Stop voice input" : "Start voice input"}
      className={`relative flex items-center justify-center rounded-2xl transition-all active:scale-90 ${className}`}
      style={{
        width: 52,
        height: 52,
        minWidth: 52,
        background: listening
          ? "linear-gradient(135deg, #dc2626, #ef4444)"
          : "linear-gradient(135deg, #15803d, #22c55e)",
        color: "#fff",
        boxShadow: listening
          ? "0 0 0 4px rgba(239,68,68,0.25)"
          : "0 2px 8px rgba(22,163,74,0.3)",
      }}
    >
      {listening ? (
        <>
          <MicOff size={22} />
          {/* Pulsing ring */}
          <span className="absolute inset-0 rounded-2xl animate-ping opacity-30" style={{ background: "#ef4444" }} />
        </>
      ) : (
        <Mic size={22} />
      )}
    </button>
  );
}
