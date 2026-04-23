"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight, Brain, CloudSun, Calculator, Leaf, MapPin, Mic,
  ShieldCheck, Smartphone, Wifi, IndianRupee, Landmark, CalendarDays, Bug, BookOpen,
  Sparkles, Zap, ChevronRight, Play, Globe,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";

const CROPS_STRIP = [
  { emoji: "🌾", hi: "धान", en: "Rice" },
  { emoji: "🌿", hi: "गेहूँ", en: "Wheat" },
  { emoji: "🌽", hi: "मक्का", en: "Maize" },
  { emoji: "🤍", hi: "कपास", en: "Cotton" },
  { emoji: "🍬", hi: "गन्ना", en: "Sugarcane" },
  { emoji: "🫘", hi: "सोयाबीन", en: "Soybean" },
  { emoji: " Peanut ", hi: "मूँगफली", en: "Groundnut" },
  { emoji: "🥭", hi: "आम", en: "Mango" },
];

export default function HomePage() {
  const { lang } = useLanguage();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);

  const FEATURES = [
    { icon: <Brain />, title: t(lang, "feat3"), desc: t(lang, "feat3d"), color: "text-purple-500", bg: "bg-purple-500/10" },
    { icon: <Mic />, title: t(lang, "feat4"), desc: t(lang, "feat4d"), color: "text-red-500", bg: "bg-red-500/10" },
    { icon: <Smartphone />, title: t(lang, "feat6"), desc: t(lang, "feat6d"), color: "text-orange-500", bg: "bg-orange-500/10" },
  ];

  return (
    <div className="bg-white dark:bg-black overflow-hidden select-none">
      {/* ─── HERO SECTION ─── */}
      <section className="relative min-h-[95vh] flex items-center pt-24 pb-20 px-4 overflow-hidden">
        {/* Background Image with Parallax */}
        <motion.div style={{ y: y1 }} className="absolute inset-0 z-0">
          <Image 
            src="/hero-bg.png" 
            alt="Hero Background" 
            fill 
            priority
            className="object-cover opacity-60 dark:opacity-40 scale-105 blur-[2px]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/80 to-white dark:from-black/20 dark:via-black/80 dark:to-black" />
        </motion.div>

        <div className="relative z-10 mx-auto max-w-6xl w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-black uppercase tracking-widest">
                <Sparkles size={14} className="text-gold-500" />
                {t(lang, "heroTagline")}
              </div>

              <h1 className="text-5xl sm:text-7xl font-black text-emerald-950 dark:text-emerald-50 leading-[1.1] tracking-tighter">
                {t(lang, "heroTitle1")} <br />
                <span className="bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent italic">
                  {t(lang, "heroTitle2")}
                </span> <br />
                {t(lang, "heroTitle3")}
              </h1>

              <p className="max-w-md text-lg sm:text-xl text-emerald-900/60 dark:text-emerald-50/60 font-medium leading-relaxed">
                {t(lang, "heroDesc")}
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  href="/recommend"
                  className="px-8 py-5 rounded-3xl bg-emerald-950 dark:bg-emerald-50 text-white dark:text-emerald-950 font-black text-lg flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-emerald-950/20 group"
                >
                  <Leaf size={24} className="group-hover:rotate-12 transition-transform" />
                  {t(lang, "heroCta")}
                  <ChevronRight size={18} />
                </Link>
                
                <Link
                  href="/chat"
                  className="px-8 py-5 rounded-3xl bg-white dark:bg-white/5 border border-emerald-200/50 dark:border-white/10 text-emerald-950 dark:text-emerald-50 font-black text-lg flex items-center gap-3 hover:bg-emerald-50 dark:hover:bg-white/10 active:scale-95 transition-all"
                >
                  <Sparkles size={22} className="text-gold-500" />
                  {lang === "hi" ? "AI से बात करें" : "Talk to AI"}
                </Link>
              </div>

              {/* Stats / Trust */}
              <div className="flex items-center gap-8 pt-6 border-t border-emerald-900/10 dark:border-white/10">
                <div>
                  <span className="block text-2xl font-black text-emerald-950 dark:text-emerald-50">50,000+</span>
                  <span className="text-[10px] uppercase font-bold text-emerald-900/40 dark:text-emerald-50/40 tracking-widest">{lang === "hi" ? "संतुष्ट किसान" : "Happy Farmers"}</span>
                </div>
                <div className="w-px h-8 bg-emerald-900/10 dark:border-white/10" />
                <div>
                  <span className="block text-2xl font-black text-emerald-950 dark:text-emerald-50">98.5%</span>
                  <span className="text-[10px] uppercase font-bold text-emerald-900/40 dark:text-emerald-50/40 tracking-widest">{lang === "hi" ? "सटीक सलाह" : "Advice Accuracy"}</span>
                </div>
              </div>
            </motion.div>

            {/* Right Asset (Card-style interactive display) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, ease: "circOut", delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative z-10 bg-white/40 dark:bg-black/40 backdrop-blur-3xl rounded-[3rem] border border-white/20 dark:border-white/10 p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-full uppercase tracking-tighter animate-pulse">Live Scan</div>
                </div>
                
                <div className="space-y-6">
                  <div className="h-32 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center border border-emerald-200/50 dark:border-emerald-800/20">
                     <Brain size={48} className="text-emerald-600 dark:text-emerald-400 opacity-50" />
                  </div>
                  <div className="h-4 w-2/3 bg-emerald-950/10 dark:bg-white/10 rounded-full" />
                  <div className="h-4 w-full bg-emerald-950/5 dark:bg-white/5 rounded-full" />
                  <div className="h-4 w-1/2 bg-emerald-950/5 dark:bg-white/5 rounded-full" />
                  
                  <div className="flex gap-3 pt-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white">
                      <Wifi size={20} />
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-gold-500 flex items-center justify-center text-white">
                      <IndianRupee size={20} />
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-blue-500 flex items-center justify-center text-white">
                      <CloudSun size={20} />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating blobs */}
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-500/20 blur-[100px] rounded-full" />
              <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-gold-500/20 blur-[100px] rounded-full" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── SERVICES GRID ─── */}
      <section className="py-24 px-4 bg-emerald-50 dark:bg-emerald-950/20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="space-y-4">
              <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">{t(lang, "servicesSub")}</span>
              <h2 className="text-4xl sm:text-5xl font-black text-emerald-950 dark:text-emerald-50 tracking-tight">
                {t(lang, "servicesTitle")}
              </h2>
            </div>
            <p className="max-w-xs text-sm text-emerald-900/50 dark:text-emerald-50/50 font-bold">
              {lang === "hi" ? "किसानों के लिए बनाई गई स्मार्ट डिजिटल सेवाएं।" : "Smart digital services built specifically for modern farmers."}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {([
              { href: "/recommend",  icon: <Leaf />,          label: t(lang, "navAdvice"),   color: "#059669", bg: "#ecfdf5", desc: lang === "hi" ? "सटीक फसल सलाह" : "Precise crop advice" },
              { href: "/weather",    icon: <CloudSun />,      label: t(lang, "navWeather"),  color: "#0284c7", bg: "#f0f9ff", desc: lang === "hi" ? "मौसम अपडेट" : "Weather alerts" },
              { href: "/mandi",      icon: <IndianRupee />,   label: t(lang, "navMandi"),    color: "#ca8a04", bg: "#fefce8", desc: lang === "hi" ? "बाज़ार भाव" : "Market rates" },
              { href: "/yojana",     icon: <Landmark />,      label: t(lang, "navYojana"),   color: "#7c3aed", bg: "#faf5ff", desc: lang === "hi" ? "सरकारी लाभ" : "Govt benefits" },
              { href: "/calendar",   icon: <CalendarDays />,  label: t(lang, "navCalendar"), color: "#0d9488", bg: "#f0fdfa", desc: lang === "hi" ? "खेती कैलेंडर" : "Farm calendar" },
              { href: "/diseases",   icon: <Bug />,           label: t(lang, "navDiseases"), color: "#dc2626", bg: "#fef2f2", desc: lang === "hi" ? "बीमारी पहचान" : "Disease ID" },
              { href: "/crops",      icon: <BookOpen />,      label: t(lang, "navCrops"),    color: "#db2777", bg: "#fdf2f8", desc: lang === "hi" ? "फसल गाइड" : "Crop guide" },
              { href: "/calculator", icon: <Calculator />,    label: t(lang, "navCalc"),     color: "#4b5563", bg: "#f9fafb", desc: lang === "hi" ? "मुनाफा जोड़ें" : "Profit calc" },
            ]).map((s, idx) => (
              <motion.div
                key={s.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                viewport={{ once: true }}
              >
                <Link href={s.href}
                  className="group relative flex flex-col items-center text-center p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-emerald-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:rotate-6" style={{ background: s.bg, color: s.color }}>
                    {s.icon}
                  </div>
                  <h3 className="font-black text-emerald-950 dark:text-emerald-50 text-base mb-1">{s.label}</h3>
                  <p className="text-[10px] font-bold text-emerald-900/40 dark:text-emerald-50/40 uppercase tracking-widest leading-tight">{s.desc}</p>
                  
                  <div className="absolute bottom-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight size={18} className="text-emerald-600" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VOICE HIGHLIGHT ─── */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-emerald-950 z-0">
           <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-100 via-transparent to-transparent" />
        </div>
        
        <div className="mx-auto max-w-4xl relative z-10 text-center space-y-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 mx-auto rounded-full bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.4)] flex items-center justify-center relative"
          >
            <Mic className="text-white w-10 h-10" />
            <span className="absolute inset-0 rounded-full border-4 border-emerald-500 animate-ping opacity-25" />
          </motion.div>
          
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
              {t(lang, "voiceTitle")}
            </h2>
            <p className="max-w-2xl mx-auto text-emerald-100/60 text-lg sm:text-xl font-medium leading-relaxed">
              {t(lang, "voiceDesc")}
            </p>
          </div>

          <Link
            href="/recommend"
            className="inline-flex items-center gap-3 px-10 py-6 rounded-full bg-emerald-500 text-white font-black text-lg hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-500/20"
          >
            {t(lang, "voiceCta")} <ChevronRight size={20} />
          </Link>
        </div>
      </section>

      {/* ─── TRUST STRIP (MARQUEE) ─── */}
      <div className="bg-white dark:bg-black py-12 border-y border-emerald-100 dark:border-white/5">
        <div className="flex items-center gap-12 whitespace-nowrap overflow-hidden group">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-12 items-center animate-marquee group-hover:pause">
              {CROPS_STRIP.map(c => (
                <div key={c.en} className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-emerald-50/50 dark:bg-white/5 border border-emerald-100 dark:border-white/5">
                  <span className="text-2xl">{c.emoji}</span>
                  <span className="font-black text-emerald-950 dark:text-emerald-50 tracking-tight uppercase text-sm">
                    {lang === "hi" ? c.hi : c.en}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ─── FINAL CTA ─── */}
      <section className="py-32 px-4 text-center">
        <div className="mx-auto max-w-3xl space-y-12">
          <div className="space-y-6">
            <motion.div 
               animate={{ rotate: [0, 10, -10, 0] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="text-6xl inline-block"
            >
              🌾
            </motion.div>
            <h2 className="text-4xl sm:text-7xl font-black text-emerald-950 dark:text-emerald-50 leading-[1.1] tracking-tighter">
              {t(lang, "ctaTitle")}
            </h2>
            <p className="text-xl text-emerald-900/50 dark:text-emerald-50/50 font-bold max-w-md mx-auto">
              {t(lang, "ctaDesc")}
            </p>
          </div>

          <Link
            href="/recommend"
            className="inline-flex items-center gap-4 px-12 py-7 rounded-[2rem] bg-emerald-950 dark:bg-emerald-50 text-white dark:text-emerald-950 font-black text-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-emerald-950/20"
          >
            {t(lang, "ctaBtn")} <ArrowRight size={28} />
          </Link>
        </div>
      </section>

      {/* Animation Global CSS */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          animation: marquee 30s linear infinite;
        }
        .pause { animation-play-state: paused; }
      `}</style>
    </div>
  );
}
