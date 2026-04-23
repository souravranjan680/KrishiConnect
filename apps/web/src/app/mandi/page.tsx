"use client";

import { useMemo, useState } from "react";
import {
  TrendingUp, TrendingDown, Minus, Search, Store, Info, Filter,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";

/* ── Types ── */
type Trend = "up" | "down" | "stable";
type MandiRow = {
  crop: string;
  cropHi: string;
  emoji: string;
  mandi: string;
  state: string;
  stateHi: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  msp: number;
  trend: Trend;
  category: string;
};

/* ── Curated indicative prices (eNAM/AGMARKNET based, Feb 2026) ── */
const MANDI_DATA: MandiRow[] = [
  // Rice
  { crop:"Rice", cropHi:"धान", emoji:"🌾", mandi:"Azadpur", state:"Delhi", stateHi:"दिल्ली", minPrice:2200, maxPrice:2600, modalPrice:2400, msp:2320, trend:"up", category:"Cereal" },
  { crop:"Rice", cropHi:"धान", emoji:"🌾", mandi:"Karnal", state:"Haryana", stateHi:"हरियाणा", minPrice:2150, maxPrice:2500, modalPrice:2320, msp:2320, trend:"stable", category:"Cereal" },
  { crop:"Rice", cropHi:"धान", emoji:"🌾", mandi:"Sambalpur", state:"Odisha", stateHi:"ओडिशा", minPrice:2100, maxPrice:2450, modalPrice:2280, msp:2320, trend:"down", category:"Cereal" },
  // Wheat
  { crop:"Wheat", cropHi:"गेहूँ", emoji:"🌿", mandi:"Indore", state:"MP", stateHi:"मध्य प्रदेश", minPrice:2200, maxPrice:2500, modalPrice:2350, msp:2275, trend:"up", category:"Cereal" },
  { crop:"Wheat", cropHi:"गेहूँ", emoji:"🌿", mandi:"Hapur", state:"UP", stateHi:"उत्तर प्रदेश", minPrice:2100, maxPrice:2400, modalPrice:2275, msp:2275, trend:"stable", category:"Cereal" },
  { crop:"Wheat", cropHi:"गेहूँ", emoji:"🌿", mandi:"Jaipur", state:"Rajasthan", stateHi:"राजस्थान", minPrice:2180, maxPrice:2450, modalPrice:2300, msp:2275, trend:"up", category:"Cereal" },
  // Maize
  { crop:"Maize", cropHi:"मक्का", emoji:"🌽", mandi:"Gulbarga", state:"Karnataka", stateHi:"कर्नाटक", minPrice:1900, maxPrice:2300, modalPrice:2100, msp:2090, trend:"stable", category:"Cereal" },
  { crop:"Maize", cropHi:"मक्का", emoji:"🌽", mandi:"Davangere", state:"Karnataka", stateHi:"कर्नाटक", minPrice:1850, maxPrice:2200, modalPrice:2050, msp:2090, trend:"down", category:"Cereal" },
  // Cotton
  { crop:"Cotton", cropHi:"कपास", emoji:"🤍", mandi:"Rajkot", state:"Gujarat", stateHi:"गुजरात", minPrice:6800, maxPrice:7500, modalPrice:7150, msp:7121, trend:"up", category:"Cash" },
  { crop:"Cotton", cropHi:"कपास", emoji:"🤍", mandi:"Guntur", state:"AP", stateHi:"आंध्र प्रदेश", minPrice:6700, maxPrice:7400, modalPrice:7050, msp:7121, trend:"stable", category:"Cash" },
  // Soybean
  { crop:"Soybean", cropHi:"सोयाबीन", emoji:"🫘", mandi:"Indore", state:"MP", stateHi:"मध्य प्रदेश", minPrice:4500, maxPrice:5200, modalPrice:4900, msp:4892, trend:"up", category:"Oilseed" },
  { crop:"Soybean", cropHi:"सोयाबीन", emoji:"🫘", mandi:"Latur", state:"Maharashtra", stateHi:"महाराष्ट्र", minPrice:4400, maxPrice:5100, modalPrice:4800, msp:4892, trend:"stable", category:"Oilseed" },
  // Chickpea
  { crop:"Chickpea", cropHi:"चना", emoji:"🟤", mandi:"Bikaner", state:"Rajasthan", stateHi:"राजस्थान", minPrice:5200, maxPrice:5800, modalPrice:5500, msp:5440, trend:"up", category:"Pulse" },
  { crop:"Chickpea", cropHi:"चना", emoji:"🟤", mandi:"Indore", state:"MP", stateHi:"मध्य प्रदेश", minPrice:5100, maxPrice:5700, modalPrice:5400, msp:5440, trend:"stable", category:"Pulse" },
  // Mustard
  { crop:"Mustard", cropHi:"सरसों", emoji:"🌼", mandi:"Alwar", state:"Rajasthan", stateHi:"राजस्थान", minPrice:5300, maxPrice:6000, modalPrice:5650, msp:5650, trend:"stable", category:"Oilseed" },
  { crop:"Mustard", cropHi:"सरसों", emoji:"🌼", mandi:"Agra", state:"UP", stateHi:"उत्तर प्रदेश", minPrice:5200, maxPrice:5900, modalPrice:5550, msp:5650, trend:"down", category:"Oilseed" },
  // Sugarcane
  { crop:"Sugarcane", cropHi:"गन्ना", emoji:"🍬", mandi:"Muzaffarnagar", state:"UP", stateHi:"उत्तर प्रदेश", minPrice:315, maxPrice:365, modalPrice:340, msp:340, trend:"stable", category:"Cash" },
  { crop:"Sugarcane", cropHi:"गन्ना", emoji:"🍬", mandi:"Kolhapur", state:"Maharashtra", stateHi:"महाराष्ट्र", minPrice:320, maxPrice:370, modalPrice:350, msp:340, trend:"up", category:"Cash" },
  // Groundnut
  { crop:"Groundnut", cropHi:"मूँगफली", emoji:"🥜", mandi:"Junagadh", state:"Gujarat", stateHi:"गुजरात", minPrice:6000, maxPrice:6800, modalPrice:6400, msp:6377, trend:"up", category:"Oilseed" },
  // Tomato
  { crop:"Tomato", cropHi:"टमाटर", emoji:"🍅", mandi:"Azadpur", state:"Delhi", stateHi:"दिल्ली", minPrice:800, maxPrice:2200, modalPrice:1500, msp:0, trend:"up", category:"Vegetable" },
  { crop:"Tomato", cropHi:"टमाटर", emoji:"🍅", mandi:"Koyambedu", state:"TN", stateHi:"तमिलनाडु", minPrice:600, maxPrice:1800, modalPrice:1200, msp:0, trend:"down", category:"Vegetable" },
  // Onion
  { crop:"Onion", cropHi:"प्याज", emoji:"🧅", mandi:"Nashik", state:"Maharashtra", stateHi:"महाराष्ट्र", minPrice:1200, maxPrice:2400, modalPrice:1800, msp:0, trend:"up", category:"Vegetable" },
  { crop:"Onion", cropHi:"प्याज", emoji:"🧅", mandi:"Azadpur", state:"Delhi", stateHi:"दिल्ली", minPrice:1400, maxPrice:2600, modalPrice:2000, msp:0, trend:"up", category:"Vegetable" },
  // Potato
  { crop:"Potato", cropHi:"आलू", emoji:"🥔", mandi:"Agra", state:"UP", stateHi:"उत्तर प्रदेश", minPrice:600, maxPrice:1500, modalPrice:1000, msp:0, trend:"down", category:"Vegetable" },
  { crop:"Potato", cropHi:"आलू", emoji:"🥔", mandi:"Azadpur", state:"Delhi", stateHi:"दिल्ली", minPrice:800, maxPrice:1600, modalPrice:1200, msp:0, trend:"stable", category:"Vegetable" },
  // Lentil
  { crop:"Lentil", cropHi:"मसूर", emoji:"🫘", mandi:"Indore", state:"MP", stateHi:"मध्य प्रदेश", minPrice:6000, maxPrice:6800, modalPrice:6400, msp:6425, trend:"stable", category:"Pulse" },
  // Bajra
  { crop:"Bajra", cropHi:"बाजरा", emoji:"🌾", mandi:"Jodhpur", state:"Rajasthan", stateHi:"राजस्थान", minPrice:2300, maxPrice:2700, modalPrice:2500, msp:2500, trend:"stable", category:"Cereal" },
  // Turmeric
  { crop:"Turmeric", cropHi:"हल्दी", emoji:"🟡", mandi:"Erode", state:"TN", stateHi:"तमिलनाडु", minPrice:7000, maxPrice:12000, modalPrice:9500, msp:0, trend:"up", category:"Spice" },
  { crop:"Turmeric", cropHi:"हल्दी", emoji:"🟡", mandi:"Sangli", state:"Maharashtra", stateHi:"महाराष्ट्र", minPrice:6500, maxPrice:10000, modalPrice:8500, msp:0, trend:"up", category:"Spice" },
  // Chilli
  { crop:"Chilli", cropHi:"मिर्च", emoji:"🌶️", mandi:"Guntur", state:"AP", stateHi:"आंध्र प्रदेश", minPrice:10000, maxPrice:15000, modalPrice:12500, msp:0, trend:"up", category:"Spice" },
  // Mango
  { crop:"Mango", cropHi:"आम", emoji:"🥭", mandi:"Vashi", state:"Maharashtra", stateHi:"महाराष्ट्र", minPrice:2000, maxPrice:4500, modalPrice:3200, msp:0, trend:"up", category:"Fruit" },
  // Banana
  { crop:"Banana", cropHi:"केला", emoji:"🍌", mandi:"Jalgaon", state:"Maharashtra", stateHi:"महाराष्ट्र", minPrice:500, maxPrice:1100, modalPrice:800, msp:0, trend:"stable", category:"Fruit" },
  // Cumin
  { crop:"Cumin", cropHi:"जीरा", emoji:"🟤", mandi:"Unjha", state:"Gujarat", stateHi:"गुजरात", minPrice:22000, maxPrice:28000, modalPrice:25000, msp:0, trend:"up", category:"Spice" },
  // Garlic
  { crop:"Garlic", cropHi:"लहसुन", emoji:"🧄", mandi:"Mandsaur", state:"MP", stateHi:"मध्य प्रदेश", minPrice:3000, maxPrice:5500, modalPrice:4200, msp:0, trend:"up", category:"Spice" },
];

const CATEGORIES = ["All", "Cereal", "Pulse", "Oilseed", "Cash", "Vegetable", "Spice", "Fruit"];

function inr(n: number) { return "₹" + n.toLocaleString("en-IN"); }

function TrendBadge({ trend, lang }: { trend: Trend; lang: "en" | "hi" }) {
  const config = {
    up: { icon: <TrendingUp size={12} />, label: t(lang, "mandiTrendUp"), color: "#16a34a", bg: "#f0fdf4" },
    down: { icon: <TrendingDown size={12} />, label: t(lang, "mandiTrendDown"), color: "#dc2626", bg: "#fef2f2" },
    stable: { icon: <Minus size={12} />, label: t(lang, "mandiTrendStable"), color: "#d97706", bg: "#fffbeb" },
  }[trend];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ color: config.color, background: config.bg }}>
      {config.icon} {config.label}
    </span>
  );
}

export default function MandiPage() {
  const { lang } = useLanguage();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = useMemo(() => {
    let data = MANDI_DATA;
    if (category !== "All") data = data.filter(r => r.category === category);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter(r =>
        r.crop.toLowerCase().includes(q) || r.cropHi.includes(search.trim()) ||
        r.mandi.toLowerCase().includes(q) || r.state.toLowerCase().includes(q) ||
        r.stateHi.includes(search.trim())
      );
    }
    return data;
  }, [search, category]);

  return (
    <div>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #7c2d12, #ea580c)" }} className="py-8 sm:py-10 px-4">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white mb-1 flex items-center gap-2">
            <Store className="w-6 h-6 text-orange-300" />
            {t(lang, "mandiTitle")}
          </h1>
          <p className="text-orange-200 text-xs sm:text-sm">{t(lang, "mandiSub")}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="bg-orange-400/20 text-orange-200 text-xs font-bold px-3 py-1 rounded-full">
              {MANDI_DATA.length} {lang === "hi" ? "रिकॉर्ड" : "Records"}
            </span>
            <span className="bg-orange-400/20 text-orange-200 text-xs font-bold px-3 py-1 rounded-full">
              📅 {lang === "hi" ? "फरवरी 2026" : "Feb 2026"}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-3 sm:px-4 py-4 sm:py-6 space-y-4">

        {/* Search + category filters */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-5">
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t(lang, "mandiSearch")}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-orange-200 bg-white text-orange-900 font-semibold outline-none focus:border-orange-500 text-sm placeholder:text-orange-300"
              style={{ fontSize: "16px" }}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(cat => (
              <button key={cat} type="button" onClick={() => setCategory(cat)}
                className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={category === cat
                  ? { background: "#ea580c", color: "#fff" }
                  : { background: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa" }}>
                <Filter size={10} className="inline mr-1" />
                {cat === "All" ? t(lang, "mandiAll") : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="text-xs font-semibold text-gray-400">{filtered.length} {lang === "hi" ? "परिणाम" : "results"}</p>

        {/* Cards */}
        {filtered.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center text-sm text-gray-400">
            {t(lang, "mandiNone")}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((row, i) => {
            const aboveMsp = row.msp > 0 && row.modalPrice >= row.msp;
            return (
              <div key={`${row.crop}-${row.mandi}-${i}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden card-animate hover:shadow-md transition-shadow"
                style={{ animationDelay: `${i * 0.03}s` }}>
                <div className="px-4 py-3 flex items-start gap-3">
                  <div className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl border"
                    style={{ background: "#fff7ed", borderColor: "#fed7aa" }}>
                    {row.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-gray-900 text-sm">
                        {lang === "hi" ? row.cropHi : row.crop}
                      </h3>
                      <TrendBadge trend={row.trend} lang={lang} />
                    </div>
                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                      🏪 {row.mandi}, {lang === "hi" ? row.stateHi : row.state}
                    </p>
                  </div>
                </div>
                <div className="px-4 pb-3">
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <div className="text-[9px] font-bold text-gray-400 uppercase">{t(lang, "mandiMin")}</div>
                      <div className="text-xs font-extrabold text-gray-700">{inr(row.minPrice)}</div>
                    </div>
                    <div className="rounded-lg p-2 text-center" style={{ background: "#fff7ed" }}>
                      <div className="text-[9px] font-bold text-orange-400 uppercase">{t(lang, "mandiModal")}</div>
                      <div className="text-sm font-extrabold text-orange-600">{inr(row.modalPrice)}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <div className="text-[9px] font-bold text-gray-400 uppercase">{t(lang, "mandiMax")}</div>
                      <div className="text-xs font-extrabold text-gray-700">{inr(row.maxPrice)}</div>
                    </div>
                  </div>
                  {row.msp > 0 && (
                    <div className="flex items-center justify-between rounded-lg px-2.5 py-1.5"
                      style={{ background: aboveMsp ? "#f0fdf4" : "#fef2f2" }}>
                      <span className="text-[10px] font-bold" style={{ color: aboveMsp ? "#16a34a" : "#dc2626" }}>
                        MSP: {inr(row.msp)}/q
                      </span>
                      <span className="text-[10px] font-bold" style={{ color: aboveMsp ? "#16a34a" : "#dc2626" }}>
                        {aboveMsp ? "✅" : "⚠️"} {aboveMsp
                          ? (lang === "hi" ? "MSP से ऊपर" : "Above MSP")
                          : (lang === "hi" ? "MSP से नीचे" : "Below MSP")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 px-4 py-3 rounded-2xl bg-orange-50 border border-orange-200 text-xs text-orange-700">
          <Info size={14} className="mt-0.5 shrink-0 text-orange-400" />
          {t(lang, "mandiDisclaimer")}
        </div>
      </div>
    </div>
  );
}
