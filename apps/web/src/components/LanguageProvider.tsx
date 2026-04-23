"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Language } from "@/lib/types";

type LanguageContextValue = {
  lang: Language;
  setLang: (lang: Language) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "crs_lang";

export function LanguageProvider({
  children,
  defaultLang = "hi",
}: {
  children: React.ReactNode;
  defaultLang?: Language;
}) {
  const [lang, setLang] = useState<Language>(defaultLang);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "hi" || saved === "en") setLang(saved);
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }

    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang, hydrated]);

  const value = useMemo(() => ({ lang, setLang }), [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
