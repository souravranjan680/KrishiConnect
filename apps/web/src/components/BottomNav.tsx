"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Leaf, CloudSun, IndianRupee, Menu, X,
  BookOpen, Calculator, Landmark, CalendarDays, Bug, Info, ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";

const TABS = [
  { href: "/",           icon: Home,         key: "navHome" as const },
  { href: "/recommend",  icon: Leaf,         key: "navAdvice" as const },
  { href: "/chat",       icon: Sparkles,     key: "navChat" as const },
  { href: "/mandi",      icon: IndianRupee,  key: "navMandi" as const },
  { href: "/weather",    icon: CloudSun,     key: "navWeather" as const },
];

const MORE_ITEMS = [
  { href: "/crops",      icon: BookOpen,      key: "navCrops" as const },
  { href: "/calculator", icon: Calculator,    key: "navCalc" as const },
  { href: "/yojana",     icon: Landmark,      key: "navYojana" as const },
  { href: "/calendar",   icon: CalendarDays,  key: "navCalendar" as const },
  { href: "/diseases",   icon: Bug,           key: "navDiseases" as const },
  { href: "/about",      icon: Info,          key: "navAbout" as const },
  { href: "/admin",      icon: ShieldCheck,   key: "navAdmin" as const },
];

export default function BottomNav() {
  const path = usePathname();
  const { lang } = useLanguage();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = MORE_ITEMS.some(m => path === m.href);

  return (
    <>
      <AnimatePresence>
        {moreOpen && (
          <div className="fixed inset-0 z-[70] sm:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-emerald-950/40 backdrop-blur-md" 
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-0 inset-x-0 bg-white dark:bg-emerald-950 rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.2)] border-t border-emerald-100 dark:border-white/10 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Drag Handle */}
              <div className="w-12 h-1.5 bg-emerald-100 dark:bg-emerald-900 rounded-full mx-auto mt-4 mb-2" />
              
              <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-50 dark:border-white/5">
                <span className="text-lg font-black text-emerald-950 dark:text-emerald-50">{t(lang, "navServices")}</span>
                <button type="button" onClick={() => setMoreOpen(false)}
                  className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-900 dark:text-emerald-50 active:scale-90 transition-transform">
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 p-4 pb-10">
                {MORE_ITEMS.map(({ href, icon: Icon, key }) => (
                  <Link key={href} href={href} onClick={() => setMoreOpen(false)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-3xl transition-all active:scale-95 ${
                      path === href 
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" 
                        : "text-emerald-950 dark:text-emerald-50 bg-emerald-50/50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                    }`}>
                    <Icon size={24} strokeWidth={path === href ? 2.5 : 2} />
                    <span className="text-[10px] font-black tracking-wide uppercase text-center leading-tight">{t(lang, key)}</span>
                  </Link>
                ))}
              </div>
              <div className="h-[env(safe-area-inset-bottom)]" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom bar */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] sm:hidden w-[92%]">
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.2)] rounded-[2.5rem] px-2 h-16 sm:h-20 flex items-center justify-around">
          {TABS.map(({ href, icon: Icon, key }) => {
            const active = path === href || (href !== "/" && path.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className="relative flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all group"
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl transition-all duration-300 ${
                    active 
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 -translate-y-1" 
                      : "text-emerald-950/40 dark:text-emerald-50/40 group-hover:text-emerald-950 dark:group-hover:text-emerald-50"
                  }`}
                >
                  <Icon size={24} strokeWidth={active ? 2.5 : 2} />
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest leading-tight transition-all ${
                  active ? "text-emerald-900 dark:text-emerald-400 opacity-100" : "opacity-0"
                }`}>
                  {t(lang, key)}
                </span>
                {active && (
                  <motion.div layoutId="tab-underline" className="absolute bottom-0 w-1 h-1 bg-emerald-500 rounded-full" />
                )}
              </Link>
            );
          })}

          {/* More button */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all group"
          >
            <div
              className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl transition-all duration-300 ${
                isMoreActive 
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 -translate-y-1" 
                  : "text-emerald-950/40 dark:text-emerald-50/40 group-hover:text-emerald-950 dark:group-hover:text-emerald-50"
              }`}
            >
              {moreOpen ? <X size={24} /> : <Menu size={24} strokeWidth={isMoreActive ? 2.5 : 2} />}
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest leading-tight transition-all ${
              isMoreActive ? "text-emerald-900 dark:text-emerald-400 opacity-100" : "opacity-0"
            }`}>
              {t(lang, "navMore")}
            </span>
          </button>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </>
  );
}
