"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";

export default function Navbar() {
  const path = usePathname();
  const { lang, setLang } = useLanguage();
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const NAV_MAIN = [
    { href: "/",           label: t(lang, "navHome") },
    { href: "/recommend",  label: t(lang, "navAdvice") },
    { href: "/chat",       label: t(lang, "navChat") },
    { href: "/weather",    label: t(lang, "navWeather") },
    { href: "/mandi",      label: t(lang, "navMandi") },
  ];

  const NAV_MORE = [
    { href: "/crops",      label: t(lang, "navCrops") },
    { href: "/calculator", label: t(lang, "navCalc") },
    { href: "/yojana",     label: t(lang, "navYojana") },
    { href: "/calendar",   label: t(lang, "navCalendar") },
    { href: "/diseases",   label: t(lang, "navDiseases") },
    { href: "/about",      label: t(lang, "navAbout") },
  ];

  const isMoreActive = NAV_MORE.some(n => path === n.href);

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-[95%] max-w-6xl">
      <div className="bg-white/70 dark:bg-black/70 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] rounded-[2rem] px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-inner bg-emerald-50 dark:bg-emerald-950 p-1 flex items-center justify-center transition-transform group-hover:scale-105">
            <Image src="/logo.png" alt="Logo" width={28} height={28} className="object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-emerald-950 dark:text-emerald-50 text-base sm:text-lg leading-none tracking-tight">KrishiConnect</span>
            <span className="text-[10px] font-bold text-gold-600 dark:text-gold-400 leading-none mt-0.5 uppercase tracking-wider">Premium AI</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1">
          {NAV_MAIN.map(n => (
            <Link key={n.href} href={n.href}
              className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                path === n.href
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-emerald-900/60 dark:text-emerald-50/60 hover:text-emerald-900 dark:hover:text-emerald-50"
              }`}>
              {n.label}
              {path === n.href && (
                <motion.div layoutId="nav-pill" className="absolute inset-0 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl -z-10" />
              )}
            </Link>
          ))}

          {/* More dropdown */}
          <div ref={moreRef} className="relative">
            <button type="button" onClick={() => setMoreOpen(v => !v)}
              className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                isMoreActive ? "text-emerald-700 dark:text-emerald-400" : "text-emerald-900/60 dark:text-emerald-50/60 hover:text-emerald-900 dark:hover:text-emerald-50"
              }`}>
              {t(lang, "navMore")} 
              <ChevronDown size={14} className={`transition-transform duration-300 ${moreOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {moreOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-[calc(100%+0.5rem)] w-52 bg-white/90 dark:bg-black/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 p-2 z-50 overflow-hidden"
                >
                  {NAV_MORE.map(n => (
                    <Link key={n.href} href={n.href} onClick={() => setMoreOpen(false)}
                      className={`block px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                        path === n.href ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-emerald-900 dark:text-emerald-50 hover:bg-emerald-50 dark:hover:bg-emerald-900/50"
                      }`}>
                      {n.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Action area */}
        <div className="flex items-center gap-3">
          {/* Lang Toggle */}
          <div className="flex bg-emerald-100/50 dark:bg-emerald-900/30 p-1 rounded-full border border-emerald-200/50 dark:border-emerald-800/30">
            {(["hi", "en"] as const).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${
                  lang === l 
                    ? "bg-white dark:bg-emerald-500 text-emerald-900 dark:text-white shadow-sm" 
                    : "text-emerald-900/40 dark:text-emerald-50/40"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          <Link href="/admin"
            className="hidden sm:flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-950 dark:bg-emerald-50 text-white dark:text-emerald-950 text-xs font-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-950/20">
            <Sparkles size={14} className="text-gold-400" />
            {t(lang, "navAdmin")}
          </Link>

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center text-emerald-950 dark:text-emerald-50 hover:bg-emerald-50 dark:hover:bg-emerald-900/50 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden absolute top-20 left-0 right-0 bg-white/90 dark:bg-black/90 backdrop-blur-2xl rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden p-4 z-50"
          >
            <div className="grid grid-cols-2 gap-2">
              {[...NAV_MAIN, ...NAV_MORE].map(n => (
                <Link key={n.href} href={n.href} onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                    path === n.href 
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                      : "text-emerald-900 dark:text-emerald-50 bg-emerald-50/50 dark:bg-emerald-900/20"
                  }`}>
                  {n.label}
                </Link>
              ))}
            </div>
            <Link href="/admin" onClick={() => setMobileMenuOpen(false)}
              className="mt-4 flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-emerald-950 dark:bg-emerald-50 text-white dark:text-emerald-950 text-sm font-black shadow-lg">
              <Sparkles size={16} className="text-gold-400" />
              {t(lang, "navAdmin")}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
