"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapPin, Navigation, Leaf, Droplets, Sprout,
  ChevronDown, ChevronUp, ThumbsUp, ThumbsDown,
  Send, CheckCircle2, AlertCircle, Loader2, BarChart3, Info,
  Sparkles, Zap, Globe, Search, Mic, MicOff, Star,
  Wind, Thermometer, Droplet, Hash,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Language, RecommendResponse } from "@/lib/types";
import { t } from "@/lib/i18n";
import { recommendCrop, submitFeedback } from "@/lib/api";
import VoiceInput from "@/components/VoiceInput";
import { useLanguage } from "@/components/LanguageProvider";
import { playError, playSuccess, primeSound } from "@/lib/sound";

type Status = "idle" | "locating" | "loading" | "success" | "error";

const CROP_META: Record<string, { emoji: string; accent: string; bg: string }> = {
  /* Cereals */
  Rice:        { emoji: "🌾", accent: "#10b981", bg: "#f0fdf4" },
  Wheat:       { emoji: "🌿", accent: "#eab308", bg: "#fefce8" },
  Maize:       { emoji: "🌽", accent: "#f97316", bg: "#fff7ed" },
  /* Cotton */
  Cotton:      { emoji: "🤍", accent: "#0ea5e9", bg: "#f0f9ff" },
  Sugarcane:   { emoji: "🍬", accent: "#8b5cf6", bg: "#f5f3ff" },
  /* Pulses */
  Chickpea:    { emoji: "🟤", accent: "#92400e", bg: "#fffbeb" },
  Lentil:      { emoji: "🫘", accent: "#84cc16", bg: "#f7fee7" },
  /* Fruits */
  Mango:       { emoji: "🥭", accent: "#f59e0b", bg: "#fffbeb" },
  Banana:      { emoji: "🍌", accent: "#fbbf24", bg: "#fffdf2" },
};
const cropMeta = (n: string) => CROP_META[n] ?? { emoji: "🌱", accent: "#10b981", bg: "#f0fdf4" };

function ConfidenceCircle({ value, accent }: { value: number; accent: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, value + 0.2); // Boost visually
  const offset = circumference - (progress * circumference);

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90">
        <circle cx="48" cy="48" r={radius} fill="transparent" stroke="currentColor" strokeWidth="6" className="text-gray-100 dark:text-white/5" />
        <motion.circle 
          cx="48" cy="48" r={radius} fill="transparent" stroke={accent} strokeWidth="6" 
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-black text-gray-900 dark:text-white">{Math.round(progress * 100)}%</span>
        <span className="text-[8px] font-black uppercase text-gray-400 tracking-tighter">Match</span>
      </div>
    </div>
  );
}

function CropCard({ rec, rank, lang }: {
  rec: RecommendResponse["recommendations"][0]; rank: number; lang: Language;
}) {
  const [open, setOpen] = useState(rank === 1);
  const meta = cropMeta(rec.crop);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-emerald-50 dark:border-white/5 shadow-sm overflow-hidden"
    >
      <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative">
          <ConfidenceCircle value={rec.confidence} accent={meta.accent} />
          <div className="absolute -top-2 -left-2 w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-lg border border-white/50 dark:border-white/10" style={{ background: meta.bg }}>
            {meta.emoji}
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h3 className="text-2xl font-black text-emerald-950 dark:text-emerald-50 tracking-tight">{rec.crop}</h3>
            <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-sm" style={{ background: meta.accent }}>
              {lang === "hi" ? `मुख्य विकल्प #${rank}` : `Priority #${rank}`}
            </span>
          </div>
          <p className="text-sm font-medium text-emerald-900/60 dark:text-emerald-50/60 leading-relaxed">
            {rec.why}
          </p>
        </div>

        <button 
          onClick={() => setOpen(!open)}
          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90"
          style={{ background: meta.accent + "15", color: meta.accent }}
        >
          {open ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-emerald-50 dark:border-white/5 bg-emerald-50/20 dark:bg-emerald-900/5"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-emerald-50 dark:divide-white/5">
              {[
                { icon: <Sprout />, label: t(lang, "advicePlanting"), text: rec.advice.planting, color: "text-emerald-500" },
                { icon: <Droplets />, label: t(lang, "adviceWater"), text: rec.advice.water, color: "text-blue-500" },
                { icon: <Zap />, label: t(lang, "adviceFertilizer"), text: rec.advice.fertilizer, color: "text-amber-500" },
              ].map((item, i) => (
                <div key={i} className="p-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`${item.color} opacity-80 shrink-0`}>{item.icon}</div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900/40 dark:text-emerald-50/40">{item.label}</span>
                  </div>
                  <p className="text-xs font-bold text-emerald-900 dark:text-emerald-50/80 leading-relaxed italic">
                    "{item.text}"
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function RecommendPage() {
  const { lang, setLang }                     = useLanguage();
  const [village, setVillage]                 = useState("");
  const [gpsToast, setGpsToast]               = useState<string | null>(null);
  const [status, setStatus]                   = useState<Status>("idle");
  const [error, setError]                     = useState<string | null>(null);
  const [result, setResult]                   = useState<RecommendResponse | null>(null);
  const [feedbackHelpful, setFeedbackHelpful] = useState<boolean | null>(null);
  const [feedbackText, setFeedbackText]       = useState("");
  const [feedbackSent, setFeedbackSent]       = useState(false);

  const canSubmit = useMemo(() => village.trim().length > 0, [village]);
  const busy      = status === "loading" || status === "locating";

  useEffect(() => {
    if (!gpsToast) return;
    const timer = window.setTimeout(() => setGpsToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [gpsToast]);

  function reset() {
    setResult(null); setError(null);
    setFeedbackHelpful(null); setFeedbackText(""); setFeedbackSent(false);
  }

  async function fetchByVillage() {
    reset(); setStatus("loading");
    try {
      setResult(await recommendCrop({ village: village.trim() }));
      playSuccess();
      setStatus("success");
    }
    catch (e) {
      playError();
      setError(e instanceof Error ? e.message : t(lang, "unknownError"));
      setStatus("error");
    }
  }

  function fetchByGps() {
    primeSound();
    reset(); setStatus("locating");
    setVillage(lang === "hi" ? "लोकेशन ढूँढ रहे हैं..." : "Locating your fields...");
    if (!navigator.geolocation) { setError(t(lang, "gpsNotSupported")); setStatus("error"); return; }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        setStatus("loading");
        try {
          const response = await recommendCrop({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          setResult(response);
          const resolved = response.location?.display ?? "";
          setVillage(resolved);
          setGpsToast(lang === "hi" ? `सफल: ${resolved}` : `Success: ${resolved}`);
          playSuccess();
          setStatus("success");
        }
        catch (e) {
          playError();
          setError(e instanceof Error ? e.message : t(lang, "unknownError"));
          setStatus("error");
        }
      },
      () => {
        setError(t(lang, "gpsPermissionDenied"));
        playError();
        setStatus("error");
      },
      { timeout: 15_000 }
    );
  }

  async function sendFeedback() {
    if (feedbackHelpful === null || !result) return;
    try {
      await submitFeedback({
        helpful: feedbackHelpful,
        text: feedbackText,
        crop: result.recommendations[0]?.crop || "unknown",
      });
      setFeedbackSent(true);
      playSuccess();
    } catch (e) {
      playError();
    }
  }

  return (
    <div className="bg-white dark:bg-black min-h-screen pb-32">
      {/* Header Area */}
      <div className="relative pt-32 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-emerald-950 z-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold-500/10 blur-[120px] rounded-full -translate-x-1/3 translate-y-1/2" />
        </div>
        
        <div className="relative z-10 mx-auto max-w-4xl text-center space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest text-gold-400"
          >
            <Sparkles size={12} />
            {lang === "hi" ? "AI पावर्ड भविष्य" : "AI Powered Future"}
          </motion.div>
          <h1 className="text-4xl sm:text-6xl font-black text-white px-2 tracking-tighter leading-none">
            {t(lang, "title")} 
          </h1>
          <p className="text-emerald-100/60 text-base sm:text-lg font-bold">
            {t(lang, "subtitle")}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 -mt-12 relative z-20 space-y-10">
        {/* Input Card */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-black/80 backdrop-blur-3xl p-8 rounded-[3rem] border border-emerald-100 dark:border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.1)] flex flex-col lg:flex-row gap-8 items-center"
        >
          <div className="flex-1 w-full space-y-4">
            <label className="block px-2 text-[10px] font-black uppercase tracking-widest text-emerald-950/40 dark:text-emerald-50/40">
              {t(lang, "villageLabel")}
            </label>
            <div className="relative group">
              <input 
                value={village}
                onChange={e => setVillage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && canSubmit && !busy && fetchByVillage()}
                placeholder={t(lang, "villagePlaceholder")}
                className="w-full px-8 py-5 rounded-3xl bg-emerald-50/50 dark:bg-white/5 border-2 border-emerald-100 dark:border-white/10 text-xl font-bold text-emerald-950 dark:text-emerald-50 placeholder:text-emerald-950/20 dark:placeholder:text-emerald-50/20 outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-white/10 transition-all shadow-inner"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                <VoiceInput
                  lang={lang}
                  onResult={setVillage}
                />
              </div>
            </div>
            {gpsToast && (
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 animate-pulse px-2">
                <CheckCircle2 size={12} /> {gpsToast}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
            <button 
              onClick={fetchByVillage}
              disabled={!canSubmit || busy}
              className="flex-1 sm:w-48 py-5 rounded-3xl bg-emerald-950 dark:bg-emerald-50 text-white dark:text-emerald-950 font-black text-base flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-950/20 disabled:opacity-50"
            >
              {status === "loading" ? <Loader2 className="animate-spin" /> : <Search size={20} />}
              {t(lang, "getRecommendation")}
            </button>
            
            <button 
              onClick={fetchByGps}
              disabled={busy}
              className="px-6 py-5 rounded-3xl bg-emerald-50 dark:bg-white/5 border border-emerald-100 dark:border-white/10 text-emerald-900 dark:text-emerald-50 font-black text-base flex items-center justify-center gap-2 hover:bg-emerald-100 dark:hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50"
            >
              {status === "locating" ? <Loader2 className="animate-spin" /> : <Navigation size={20} />}
              {t(lang, "useGps")}
            </button>
          </div>
        </motion.div>

        {/* Results Area */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              {/* Context Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: <Thermometer />, label: t(lang, "temperature"), val: `${result.weather?.temperature}\u00B0C`, color: "text-orange-500" },
                  { icon: <Droplet />, label: t(lang, "humidity"), val: `${result.weather?.humidity}%`, color: "text-blue-500" },
                  { icon: <Wind />, label: t(lang, "rain30"), val: `${result.weather?.rainfall}mm`, color: "text-emerald-500" },
                  { icon: <Hash />, label: t(lang, "soilPh"), val: `pH ${result.soil?.ph}`, color: "text-purple-500" },
                ].map((item, i) => (
                  <div key={i} className="p-6 bg-white dark:bg-white/5 rounded-[2.5rem] border border-emerald-50 dark:border-white/5 shadow-sm text-center space-y-2">
                    <div className={`${item.color} flex justify-center`}>{item.icon}</div>
                    <span className="block text-[8px] font-black uppercase tracking-widest text-emerald-900/40 dark:text-emerald-50/40">{item.label}</span>
                    <span className="block text-lg font-black text-emerald-950 dark:text-emerald-50 tracking-tight">{item.val}</span>
                  </div>
                ))}
              </div>

              {/* Crop Recommendations */}
              <div className="space-y-6">
                <div className="flex items-center gap-4 px-2">
                   <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600">
                      <Star size={20} />
                   </div>
                   <h2 className="text-3xl font-black text-emerald-950 dark:text-emerald-50 tracking-tight">{t(lang, "resultsHeader")}</h2>
                </div>
                <div className="flex flex-col gap-6">
                  {result.recommendations.map((rec, i) => (
                    <CropCard key={rec.crop} rec={rec} rank={i + 1} lang={lang} />
                  ))}
                </div>
              </div>

              {/* Feedback Section */}
              <div className="bg-emerald-950 dark:bg-emerald-950/20 p-10 rounded-[3.5rem] text-center space-y-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent opacity-30" />
                
                {feedbackSent ? (
                  <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="space-y-4 py-10">
                    <div className="w-20 h-20 bg-emerald-500 rounded-full mx-auto flex items-center justify-center text-white shadow-2xl">
                      <CheckCircle2 size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-white">{t(lang, "feedbackThanks")}</h3>
                    <p className="text-emerald-100/60 font-medium">{t(lang, "feedbackHelps")}</p>
                  </motion.div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <h3 className="text-3xl font-black text-white tracking-tight">{t(lang, "feedbackHeader")}</h3>
                      <p className="text-emerald-100/60 text-sm font-bold uppercase tracking-widest">{t(lang, "feedbackTrain")}</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
                      <button 
                        onClick={() => setFeedbackHelpful(true)}
                        className={`flex-1 py-5 rounded-3xl font-black text-lg flex items-center justify-center gap-3 transition-all ${
                          feedbackHelpful === true ? "bg-emerald-500 text-emerald-950 scale-105" : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                        }`}
                      >
                        <ThumbsUp size={24} /> {t(lang, "thumbsUp")}
                      </button>
                      <button 
                        onClick={() => setFeedbackHelpful(false)}
                        className={`flex-1 py-5 rounded-3xl font-black text-lg flex items-center justify-center gap-3 transition-all ${
                          feedbackHelpful === false ? "bg-red-500 text-red-950 scale-105" : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                        }`}
                      >
                        <ThumbsDown size={24} /> {t(lang, "thumbsDown")}
                      </button>
                    </div>

                    <div className="relative group max-w-2xl mx-auto">
                      <textarea 
                        value={feedbackText}
                        onChange={e => setFeedbackText(e.target.value)}
                        placeholder={t(lang, "feedbackPlaceholder")}
                        rows={2}
                        className="w-full px-8 py-6 rounded-[2rem] bg-white/5 border-2 border-white/10 text-white font-bold placeholder:text-white/20 outline-none focus:border-emerald-500 focus:bg-white/10 transition-all resize-none"
                      />
                    </div>

                    <button 
                      onClick={sendFeedback}
                      disabled={feedbackHelpful === null}
                      className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-gold-500 text-emerald-950 font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-xl shadow-gold-500/20 disabled:opacity-30"
                    >
                      <Send size={20} /> {t(lang, "submitFeedback")}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {status === "idle" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 text-center space-y-6"
          >
            <div className="w-24 h-24 mx-auto rounded-[2rem] bg-emerald-50/50 dark:bg-white/5 flex items-center justify-center text-4xl">
               🌱
            </div>
            <p className="text-emerald-950/40 dark:text-emerald-50/40 font-black uppercase tracking-[0.2em] text-xs">
              {t(lang, "idleMsg")}
            </p>
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-6 rounded-[2rem] bg-red-500/10 border-2 border-red-500/20 text-red-600 dark:text-red-400 text-sm font-black flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
               <AlertCircle size={24} />
            </div>
            {error}
          </motion.div>
        )}
      </div>
    </div>
  );
}
