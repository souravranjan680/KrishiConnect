"use client";

import Link from "next/link";
import { Leaf, Brain, ArrowRight } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { t, type I18nKey } from "@/lib/i18n";

const TECH: Array<{ name: string; descKey: I18nKey; icon: string }> = [
  { name: "Next.js 16", descKey: "aboutTech1Desc", icon: "⚡" },
  { name: "FastAPI", descKey: "aboutTech2Desc", icon: "🐍" },
  { name: "scikit-learn", descKey: "aboutTech3Desc", icon: "🤖" },
  { name: "SQLite", descKey: "aboutTech4Desc", icon: "🗄️" },
  { name: "Tailwind CSS", descKey: "aboutTech5Desc", icon: "🎨" },
  { name: "PWA", descKey: "aboutTech6Desc", icon: "📱" },
];

const PIPELINE: Array<{ icon: string; titleKey: I18nKey; descKey: I18nKey }> = [
  { icon: "📍", titleKey: "aboutPipe1Title", descKey: "aboutPipe1Desc" },
  { icon: "🌤️", titleKey: "aboutPipe2Title", descKey: "aboutPipe2Desc" },
  { icon: "🌱", titleKey: "aboutPipe3Title", descKey: "aboutPipe3Desc" },
  { icon: "🤖", titleKey: "aboutPipe4Title", descKey: "aboutPipe4Desc" },
  { icon: "📊", titleKey: "aboutPipe5Title", descKey: "aboutPipe5Desc" },
  { icon: "🔄", titleKey: "aboutPipe6Title", descKey: "aboutPipe6Desc" },
];

const ROADMAP: Array<{ done: boolean; key: I18nKey }> = [
  { done: true, key: "aboutRoad1" },
  { done: true, key: "aboutRoad2" },
  { done: true, key: "aboutRoad3" },
  { done: false, key: "aboutRoad4" },
  { done: false, key: "aboutRoad5" },
  { done: false, key: "aboutRoad6" },
  { done: false, key: "aboutRoad7" },
];

export default function AboutPage() {
  const { lang } = useLanguage();

  return (
    <div>
      {/* Hero */}
      <section style={{ background: "linear-gradient(135deg, #14532d, #15803d)" }} className="py-10 sm:py-16 px-4 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-green-200 text-xs sm:text-sm font-medium mb-4">
            <Brain size={14} /> {t(lang, "aboutHeroTag")}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            {t(lang, "aboutHeroTitle")} <span className="text-green-300">{t(lang, "aboutHeroTitleAccent")}</span>
          </h1>
          <p className="mt-4 text-green-100 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            {t(lang, "aboutHeroDesc")}
          </p>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="py-10 sm:py-14 px-4 bg-white">
        <div className="mx-auto max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="rounded-3xl border border-red-100 bg-red-50 p-5 sm:p-6">
            <h3 className="text-lg font-extrabold text-red-800 mb-3">{"❌"} {t(lang, "aboutProblemTitle")}</h3>
            <ul className="space-y-2 text-sm text-red-700 leading-relaxed">
              <li>{"•"} {t(lang, "aboutProblem1")}</li>
              <li>{"•"} {t(lang, "aboutProblem2")}</li>
              <li>{"•"} {t(lang, "aboutProblem3")}</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-green-100 bg-green-50 p-5 sm:p-6">
            <h3 className="text-lg font-extrabold text-green-800 mb-3">{"✅"} {t(lang, "aboutSolutionTitle")}</h3>
            <ul className="space-y-2 text-sm text-green-700 leading-relaxed">
              <li>{"•"} {t(lang, "aboutSolution1")}</li>
              <li>{"•"} {t(lang, "aboutSolution2")}</li>
              <li>{"•"} {t(lang, "aboutSolution3")}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* AI Pipeline */}
      <section className="py-10 sm:py-14 px-4 bg-gray-50">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-green-900 mb-8">
            {"🤖"} {t(lang, "aboutPipelineTitle")}
          </h2>
          <div className="space-y-3">
            {PIPELINE.map((p, i) => (
              <div key={i} className="flex items-start gap-3 bg-white rounded-2xl p-4 border border-green-100 shadow-sm">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-xl">
                  {p.icon}
                </div>
                <div>
                  <div className="font-bold text-green-900 text-sm">{t(lang, p.titleKey)}</div>
                  <div className="text-sm text-gray-600 mt-0.5">{t(lang, p.descKey)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-10 sm:py-14 px-4 bg-white">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-green-900 mb-8">
            {"🛠️"} {t(lang, "aboutTechTitle")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {TECH.map(ti => (
              <div key={ti.name} className="rounded-2xl border border-green-100 p-4 bg-green-50/50">
                <div className="text-2xl mb-2">{ti.icon}</div>
                <div className="font-bold text-green-900 text-sm">{ti.name}</div>
                <div className="text-xs text-gray-600 mt-1 leading-relaxed">{t(lang, ti.descKey)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-10 sm:py-14 px-4 bg-gray-50">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-green-900 mb-8">
            {"🗺️"} {t(lang, "aboutRoadmapTitle")}
          </h2>
          <div className="space-y-3">
            {ROADMAP.map((r, i) => (
              <div key={i} className={`flex items-start gap-3 rounded-2xl p-4 border ${r.done ? "bg-green-50 border-green-200" : "bg-white border-gray-200"}`}>
                <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${r.done ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                  {r.done ? "\u2713" : i + 1}
                </span>
                <span className={`text-sm ${r.done ? "text-green-800 font-semibold" : "text-gray-700"}`}>{t(lang, r.key)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 sm:py-16 px-4" style={{ background: "linear-gradient(135deg, #14532d, #15803d)" }}>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
            {t(lang, "aboutCtaTitle")}
          </h2>
          <p className="text-green-200 mb-6 text-sm sm:text-base">
            {t(lang, "aboutCtaDesc")}
          </p>
          <Link href="/recommend"
            className="inline-flex items-center gap-2 bg-white text-green-800 font-extrabold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-base">
            <Leaf size={20} /> {t(lang, "aboutCtaBtn")} <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
