"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Calculator,
  Sprout,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Wallet,
  Wheat,
  BarChart3,
  Info,
  Coins,
  Users,
  Droplets,
  Package,
  PieChart,
  Search,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";
import type { Language } from "@/lib/types";

/* ──────────────────────────────────────────────
   Per-crop default data (per hectare basis)
   MSP 2025-26 + avg cost estimates from ICAR/CACP
   ────────────────────────────────────────────── */
type CropData = {
  name: string;
  hindi: string;
  emoji: string;
  accent: string;
  bg: string;
  category: string;
  yieldPerHa: number;   // quintal/hectare
  pricePerQt: number;   // Rs per quintal
  seed: number;         // Rs/ha
  fertilizer: number;
  labour: number;
  irrigation: number;
  other: number;
};

const CROPS: CropData[] = [
  // Cereals
  { name:"Rice",       hindi:"धान",      emoji:"🌾", accent:"#16a34a", bg:"#f0fdf4", category:"Cereal",    yieldPerHa:40,  pricePerQt:2320,  seed:1500,  fertilizer:6000,  labour:12000, irrigation:5000,  other:2000 },
  { name:"Wheat",      hindi:"गेहूँ",    emoji:"🌿", accent:"#ca8a04", bg:"#fefce8", category:"Cereal",    yieldPerHa:35,  pricePerQt:2275,  seed:2000,  fertilizer:5500,  labour:10000, irrigation:4000,  other:1500 },
  { name:"Maize",      hindi:"मक्का",    emoji:"🌽", accent:"#ea580c", bg:"#fff7ed", category:"Cereal",    yieldPerHa:30,  pricePerQt:2090,  seed:1200,  fertilizer:5000,  labour:9000,  irrigation:3500,  other:1500 },
  { name:"Barley",     hindi:"जौ",       emoji:"🌾", accent:"#92400e", bg:"#fef3c7", category:"Cereal",    yieldPerHa:28,  pricePerQt:1850,  seed:1000,  fertilizer:3500,  labour:8000,  irrigation:2500,  other:1200 },
  { name:"Bajra",      hindi:"बाजरा",    emoji:"🌾", accent:"#d97706", bg:"#fffbeb", category:"Cereal",    yieldPerHa:18,  pricePerQt:2500,  seed:500,   fertilizer:3000,  labour:7000,  irrigation:1500,  other:1000 },
  { name:"Jowar",      hindi:"ज्वार",    emoji:"🌾", accent:"#b45309", bg:"#fef3c7", category:"Cereal",    yieldPerHa:20,  pricePerQt:3180,  seed:600,   fertilizer:3500,  labour:7500,  irrigation:2000,  other:1000 },
  { name:"Ragi",       hindi:"रागी",     emoji:"🌾", accent:"#dc2626", bg:"#fef2f2", category:"Cereal",    yieldPerHa:18,  pricePerQt:3846,  seed:500,   fertilizer:3000,  labour:8000,  irrigation:2000,  other:1000 },

  // Pulses
  { name:"Chickpea",   hindi:"चना",      emoji:"🟤", accent:"#b45309", bg:"#fef3c7", category:"Pulse",     yieldPerHa:12,  pricePerQt:5440,  seed:2000,  fertilizer:3000,  labour:8000,  irrigation:2000,  other:1200 },
  { name:"Lentil",     hindi:"मसूर",     emoji:"🫘", accent:"#a16207", bg:"#fef9c3", category:"Pulse",     yieldPerHa:10,  pricePerQt:6425,  seed:2000,  fertilizer:2500,  labour:7000,  irrigation:1500,  other:1000 },
  { name:"Peas",       hindi:"मटर",      emoji:"🟢", accent:"#16a34a", bg:"#f0fdf4", category:"Pulse",     yieldPerHa:10,  pricePerQt:5500,  seed:3000,  fertilizer:3000,  labour:8000,  irrigation:2500,  other:1200 },

  // Oilseeds
  { name:"Soybean",    hindi:"सोयाबीन", emoji:"🫘", accent:"#65a30d", bg:"#f7fee7", category:"Oilseed",   yieldPerHa:12,  pricePerQt:4892,  seed:2500,  fertilizer:3500,  labour:8000,  irrigation:2000,  other:1500 },
  { name:"Groundnut",  hindi:"मूँगफली",  emoji:"🥜", accent:"#d97706", bg:"#fffbeb", category:"Oilseed",   yieldPerHa:18,  pricePerQt:6377,  seed:4000,  fertilizer:4000,  labour:10000, irrigation:3000,  other:2000 },
  { name:"Mustard",    hindi:"सरसों",    emoji:"🌼", accent:"#eab308", bg:"#fefce8", category:"Oilseed",   yieldPerHa:14,  pricePerQt:5650,  seed:800,   fertilizer:3500,  labour:7000,  irrigation:2500,  other:1200 },
  { name:"Sunflower",  hindi:"सूरजमुखी", emoji:"🌻", accent:"#f59e0b", bg:"#fffbeb", category:"Oilseed",   yieldPerHa:12,  pricePerQt:6760,  seed:1000,  fertilizer:4000,  labour:8000,  irrigation:3000,  other:1500 },
  { name:"Sesame",     hindi:"तिल",      emoji:"🌿", accent:"#92400e", bg:"#fef3c7", category:"Oilseed",   yieldPerHa:5,   pricePerQt:8635,  seed:500,   fertilizer:2000,  labour:6000,  irrigation:1500,  other:800  },

  // Cash/Fiber
  { name:"Cotton",     hindi:"कपास",    emoji:"🤍", accent:"#0891b2", bg:"#f0f9ff", category:"Cash",      yieldPerHa:20,  pricePerQt:7121,  seed:3000,  fertilizer:7000,  labour:15000, irrigation:5000,  other:3000 },
  { name:"Sugarcane",  hindi:"गन्ना",    emoji:"🍬", accent:"#9333ea", bg:"#faf5ff", category:"Cash",      yieldPerHa:700, pricePerQt:340,   seed:8000,  fertilizer:10000, labour:20000, irrigation:8000,  other:4000 },
  { name:"Jute",       hindi:"जूट",      emoji:"🧶", accent:"#65a30d", bg:"#f7fee7", category:"Cash",      yieldPerHa:25,  pricePerQt:5050,  seed:800,   fertilizer:3000,  labour:10000, irrigation:2000,  other:1500 },
  { name:"Tobacco",    hindi:"तम्बाकू",  emoji:"🍂", accent:"#78716c", bg:"#f5f5f4", category:"Cash",      yieldPerHa:18,  pricePerQt:6500,  seed:500,   fertilizer:5000,  labour:12000, irrigation:3000,  other:2000 },

  // Plantation
  { name:"Tea",        hindi:"चाय",      emoji:"🍵", accent:"#15803d", bg:"#f0fdf4", category:"Plantation",yieldPerHa:20,  pricePerQt:18000, seed:15000, fertilizer:8000,  labour:25000, irrigation:5000,  other:5000 },
  { name:"Coffee",     hindi:"कॉफ़ी",    emoji:"☕", accent:"#78350f", bg:"#fef3c7", category:"Plantation",yieldPerHa:10,  pricePerQt:24000, seed:10000, fertilizer:7000,  labour:20000, irrigation:4000,  other:4000 },
  { name:"Rubber",     hindi:"रबड़",     emoji:"🌳", accent:"#374151", bg:"#f3f4f6", category:"Plantation",yieldPerHa:15,  pricePerQt:15000, seed:12000, fertilizer:5000,  labour:18000, irrigation:3000,  other:4000 },
  { name:"Coconut",    hindi:"नारियल",   emoji:"🥥", accent:"#059669", bg:"#ecfdf5", category:"Plantation",yieldPerHa:100, pricePerQt:2800,  seed:8000,  fertilizer:6000,  labour:15000, irrigation:5000,  other:3000 },
  { name:"Arecanut",   hindi:"सुपारी",   emoji:"🌴", accent:"#0d9488", bg:"#f0fdfa", category:"Plantation",yieldPerHa:20,  pricePerQt:35000, seed:10000, fertilizer:5000,  labour:15000, irrigation:5000,  other:3000 },
  { name:"Cashew",     hindi:"काजू",     emoji:"🥜", accent:"#c2410c", bg:"#fff7ed", category:"Plantation",yieldPerHa:10,  pricePerQt:12000, seed:5000,  fertilizer:3000,  labour:10000, irrigation:2000,  other:2000 },

  // Spices
  { name:"BlackPepper",hindi:"काली मिर्च",emoji:"⚫",accent:"#1c1917", bg:"#f5f5f4", category:"Spice",     yieldPerHa:3,   pricePerQt:55000, seed:8000,  fertilizer:5000,  labour:15000, irrigation:4000,  other:3000 },
  { name:"Cardamom",   hindi:"इलायची",   emoji:"💚", accent:"#15803d", bg:"#f0fdf4", category:"Spice",     yieldPerHa:2.5, pricePerQt:120000,seed:10000, fertilizer:6000,  labour:20000, irrigation:5000,  other:4000 },
  { name:"Clove",      hindi:"लौंग",     emoji:"🟤", accent:"#92400e", bg:"#fef3c7", category:"Spice",     yieldPerHa:3,   pricePerQt:90000, seed:8000,  fertilizer:4000,  labour:15000, irrigation:3000,  other:3000 },
  { name:"Ginger",     hindi:"अदरक",     emoji:"🫚", accent:"#d97706", bg:"#fffbeb", category:"Spice",     yieldPerHa:200, pricePerQt:4000,  seed:30000, fertilizer:8000,  labour:20000, irrigation:5000,  other:3000 },
  { name:"Turmeric",   hindi:"हल्दी",    emoji:"🟡", accent:"#ca8a04", bg:"#fefce8", category:"Spice",     yieldPerHa:250, pricePerQt:8000,  seed:20000, fertilizer:8000,  labour:18000, irrigation:5000,  other:3000 },
  { name:"Garlic",     hindi:"लहसुन",    emoji:"🧄", accent:"#9333ea", bg:"#faf5ff", category:"Spice",     yieldPerHa:80,  pricePerQt:4000,  seed:15000, fertilizer:5000,  labour:12000, irrigation:3000,  other:2000 },
  { name:"Coriander",  hindi:"धनिया",    emoji:"🌿", accent:"#65a30d", bg:"#f7fee7", category:"Spice",     yieldPerHa:10,  pricePerQt:8000,  seed:2000,  fertilizer:2500,  labour:7000,  irrigation:2000,  other:1000 },
  { name:"Cumin",      hindi:"जीरा",     emoji:"🟤", accent:"#a16207", bg:"#fef9c3", category:"Spice",     yieldPerHa:5,   pricePerQt:25000, seed:2000,  fertilizer:2500,  labour:8000,  irrigation:2000,  other:1200 },
  { name:"Chilli",     hindi:"मिर्च",    emoji:"🌶️", accent:"#dc2626", bg:"#fef2f2", category:"Spice",     yieldPerHa:20,  pricePerQt:12000, seed:1500,  fertilizer:5000,  labour:12000, irrigation:4000,  other:2000 },

  // Fruits
  { name:"Mango",      hindi:"आम",       emoji:"🥭", accent:"#d97706", bg:"#fffbeb", category:"Fruit",     yieldPerHa:100, pricePerQt:3000,  seed:5000,  fertilizer:6000,  labour:12000, irrigation:4000,  other:3000 },
  { name:"Banana",     hindi:"केला",      emoji:"🍌", accent:"#eab308", bg:"#fefce8", category:"Fruit",     yieldPerHa:400, pricePerQt:800,   seed:15000, fertilizer:8000,  labour:15000, irrigation:6000,  other:3000 },
  { name:"Papaya",     hindi:"पपीता",    emoji:"🍈", accent:"#f97316", bg:"#fff7ed", category:"Fruit",     yieldPerHa:300, pricePerQt:1200,  seed:5000,  fertilizer:6000,  labour:12000, irrigation:4000,  other:2500 },
  { name:"Guava",      hindi:"अमरूद",    emoji:"🍐", accent:"#65a30d", bg:"#f7fee7", category:"Fruit",     yieldPerHa:150, pricePerQt:2000,  seed:4000,  fertilizer:4000,  labour:10000, irrigation:3000,  other:2000 },
  { name:"Pomegranate",hindi:"अनार",     emoji:"🔴", accent:"#dc2626", bg:"#fef2f2", category:"Fruit",     yieldPerHa:80,  pricePerQt:5000,  seed:8000,  fertilizer:6000,  labour:12000, irrigation:5000,  other:3000 },
  { name:"Grape",      hindi:"अंगूर",    emoji:"🍇", accent:"#7c3aed", bg:"#faf5ff", category:"Fruit",     yieldPerHa:200, pricePerQt:4000,  seed:20000, fertilizer:10000, labour:25000, irrigation:8000,  other:5000 },
  { name:"Orange",     hindi:"संतरा",    emoji:"🍊", accent:"#ea580c", bg:"#fff7ed", category:"Fruit",     yieldPerHa:100, pricePerQt:2500,  seed:5000,  fertilizer:5000,  labour:10000, irrigation:4000,  other:2500 },
  { name:"Watermelon", hindi:"तरबूज",    emoji:"🍉", accent:"#dc2626", bg:"#fef2f2", category:"Fruit",     yieldPerHa:250, pricePerQt:600,   seed:1500,  fertilizer:4000,  labour:8000,  irrigation:3000,  other:1500 },
  { name:"Jackfruit",  hindi:"कटहल",     emoji:"🍈", accent:"#65a30d", bg:"#f7fee7", category:"Fruit",     yieldPerHa:120, pricePerQt:2000,  seed:3000,  fertilizer:3000,  labour:8000,  irrigation:2000,  other:1500 },

  // Vegetables
  { name:"Tomato",     hindi:"टमाटर",    emoji:"🍅", accent:"#dc2626", bg:"#fef2f2", category:"Vegetable", yieldPerHa:250, pricePerQt:1500,  seed:1000,  fertilizer:6000,  labour:12000, irrigation:4000,  other:2000 },
  { name:"Onion",      hindi:"प्याज",    emoji:"🧅", accent:"#9333ea", bg:"#faf5ff", category:"Vegetable", yieldPerHa:200, pricePerQt:1800,  seed:2000,  fertilizer:5000,  labour:12000, irrigation:4000,  other:2000 },
  { name:"Potato",     hindi:"आलू",      emoji:"🥔", accent:"#a16207", bg:"#fef9c3", category:"Vegetable", yieldPerHa:250, pricePerQt:1200,  seed:15000, fertilizer:8000,  labour:12000, irrigation:5000,  other:3000 },
  { name:"Brinjal",    hindi:"बैंगन",    emoji:"🍆", accent:"#7c3aed", bg:"#faf5ff", category:"Vegetable", yieldPerHa:300, pricePerQt:1000,  seed:500,   fertilizer:5000,  labour:10000, irrigation:3500,  other:1500 },
  { name:"Cabbage",    hindi:"पत्तागोभी", emoji:"🥬",accent:"#0891b2", bg:"#f0f9ff", category:"Vegetable", yieldPerHa:300, pricePerQt:800,   seed:500,   fertilizer:5000,  labour:10000, irrigation:3000,  other:1500 },
  { name:"Cauliflower",hindi:"फूलगोभी",  emoji:"🤍", accent:"#6366f1", bg:"#eef2ff", category:"Vegetable", yieldPerHa:200, pricePerQt:1200,  seed:600,   fertilizer:5000,  labour:10000, irrigation:3000,  other:1500 },
  { name:"Okra",       hindi:"भिंडी",    emoji:"🟢", accent:"#16a34a", bg:"#f0fdf4", category:"Vegetable", yieldPerHa:100, pricePerQt:2000,  seed:1000,  fertilizer:3500,  labour:8000,  irrigation:2500,  other:1200 },
];

/* Unit conversions */
type LandUnit = "bigha" | "acre" | "hectare";
const TO_HECTARE: Record<LandUnit, number> = { bigha: 0.25, acre: 0.4047, hectare: 1 };
function unitLabel(u: LandUnit, lang: Language) {
  return u === "bigha" ? t(lang, "calcBigha") : u === "acre" ? t(lang, "calcAcre") : t(lang, "calcHectare");
}
function inr(n: number) {
  return "\u20B9" + Math.round(n).toLocaleString("en-IN");
}

/* Animated bar */
function AnimBar({ pct, color, label, amount }: { pct: number; color: string; label: string; amount: string }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-semibold text-gray-600">{label}</span>
        <span className="font-bold" style={{ color }}>{amount}</span>
      </div>
      <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full confidence-bar"
          style={{ background: color, "--target-width": `${Math.min(pct, 100)}%` } as React.CSSProperties} />
      </div>
    </div>
  );
}

/* Cost donut ring */
function CostRing({ segments, lang }: { segments: { label: string; value: number; color: string }[]; lang: Language }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) return null;
  let cum = 0;
  const gradientParts = segments.map(seg => {
    const start = (cum / total) * 100;
    cum += seg.value;
    const end = (cum / total) * 100;
    return `${seg.color} ${start.toFixed(1)}% ${end.toFixed(1)}%`;
  });
  const gradient = `conic-gradient(${gradientParts.join(", ")})`;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full" style={{ background: gradient }}>
        <div className="absolute inset-3 sm:inset-4 rounded-full bg-white flex flex-col items-center justify-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase">{t(lang, "calcTotalExpense")}</span>
          <span className="text-sm sm:text-base font-extrabold text-gray-800">{inr(total)}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {segments.filter(s => s.value > 0).map(s => (
          <div key={s.label} className="flex items-center gap-1.5 text-[10px] sm:text-xs">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-gray-600 font-medium">{s.label}</span>
            <span className="font-bold text-gray-800">{Math.round((s.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════ Main ═══════ */
export default function CalculatorPage() {
  const { lang } = useLanguage();

  const [selectedCrop, setSelectedCrop] = useState("");
  const [cropSearch, setCropSearch] = useState("");
  const [landArea, setLandArea] = useState("1");
  const [unit, setUnit] = useState<LandUnit>("bigha");
  const [seedCost, setSeedCost] = useState("");
  const [fertCost, setFertCost] = useState("");
  const [labourCost, setLabourCost] = useState("");
  const [irriCost, setIrriCost] = useState("");
  const [otherCost, setOtherCost] = useState("");
  const [yieldQtl, setYieldQtl] = useState("");
  const [priceQt, setPriceQt] = useState("");
  const [calculated, setCalculated] = useState(false);

  const cropData = useMemo(() => CROPS.find(c => c.name === selectedCrop), [selectedCrop]);

  const filteredCrops = useMemo(() => {
    if (!cropSearch.trim()) return CROPS;
    const q = cropSearch.trim().toLowerCase();
    return CROPS.filter(c => c.name.toLowerCase().includes(q) || c.hindi.includes(cropSearch.trim()) || c.category.toLowerCase().includes(q));
  }, [cropSearch]);

  const handleCropChange = useCallback((name: string) => {
    setSelectedCrop(name);
    setCalculated(false);
    const cd = CROPS.find(c => c.name === name);
    if (!cd) return;
    const ha = parseFloat(landArea || "1") * TO_HECTARE[unit];
    setSeedCost(String(Math.round(cd.seed * ha)));
    setFertCost(String(Math.round(cd.fertilizer * ha)));
    setLabourCost(String(Math.round(cd.labour * ha)));
    setIrriCost(String(Math.round(cd.irrigation * ha)));
    setOtherCost(String(Math.round(cd.other * ha)));
    setYieldQtl(String(Math.round(cd.yieldPerHa * ha * 10) / 10));
    setPriceQt(String(cd.pricePerQt));
  }, [landArea, unit]);

  const handleAreaChange = useCallback((val: string, u?: LandUnit) => {
    if (u) setUnit(u); else setLandArea(val);
    const areaVal = parseFloat(u ? landArea : val) || 0;
    const unitVal = u || unit;
    const cd = CROPS.find(c => c.name === selectedCrop);
    if (!cd) return;
    const ha = areaVal * TO_HECTARE[unitVal];
    setSeedCost(String(Math.round(cd.seed * ha)));
    setFertCost(String(Math.round(cd.fertilizer * ha)));
    setLabourCost(String(Math.round(cd.labour * ha)));
    setIrriCost(String(Math.round(cd.irrigation * ha)));
    setOtherCost(String(Math.round(cd.other * ha)));
    setYieldQtl(String(Math.round(cd.yieldPerHa * ha * 10) / 10));
  }, [landArea, unit, selectedCrop]);

  const reset = () => {
    setSelectedCrop(""); setLandArea("1"); setCropSearch("");
    setSeedCost(""); setFertCost(""); setLabourCost(""); setIrriCost(""); setOtherCost("");
    setYieldQtl(""); setPriceQt(""); setCalculated(false);
  };

  const seed = parseFloat(seedCost) || 0;
  const fert = parseFloat(fertCost) || 0;
  const labour = parseFloat(labourCost) || 0;
  const irri = parseFloat(irriCost) || 0;
  const other = parseFloat(otherCost) || 0;
  const totalExpense = seed + fert + labour + irri + other;
  const yld = parseFloat(yieldQtl) || 0;
  const price = parseFloat(priceQt) || 0;
  const revenue = yld * price;
  const profit = revenue - totalExpense;
  const isProfit = profit >= 0;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const roi = totalExpense > 0 ? (profit / totalExpense) * 100 : 0;
  const areaNum = parseFloat(landArea) || 1;
  const profitPerUnit = profit / areaNum;

  const costSegments = [
    { label: t(lang, "calcSeedCost"), value: seed, color: "#16a34a" },
    { label: t(lang, "calcFertCost"), value: fert, color: "#0891b2" },
    { label: t(lang, "calcLabourCost"), value: labour, color: "#9333ea" },
    { label: t(lang, "calcIrriCost"), value: irri, color: "#ea580c" },
    { label: t(lang, "calcOtherCost"), value: other, color: "#6b7280" },
  ];
  const maxCost = Math.max(seed, fert, labour, irri, other, 1);

  return (
    <div>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #14532d, #15803d)" }} className="py-8 sm:py-10 px-4">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white mb-1 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-green-300" />
            {t(lang, "calcTitle")}
          </h1>
          <p className="text-green-200 text-xs sm:text-sm">{t(lang, "calcSub")}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="bg-green-400/20 text-green-200 text-xs font-bold px-3 py-1 rounded-full">
              {CROPS.length} {lang === "hi" ? "फसलें" : "Crops"}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-3 sm:px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">

          {/* LEFT: Inputs */}
          <div className="lg:col-span-3 space-y-4">

            {/* Crop selector with search */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-5">
              <label className="flex items-center gap-2 font-bold text-green-900 mb-3">
                <Sprout size={18} className="text-green-600" />
                {t(lang, "calcCrop")}
              </label>
              {/* Search input */}
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400" />
                <input
                  value={cropSearch}
                  onChange={e => setCropSearch(e.target.value)}
                  placeholder={lang === "hi" ? "फसल खोजें..." : "Search crop..."}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border-2 border-green-200 bg-white text-sm text-green-900 placeholder:text-green-300 outline-none focus:border-green-500"
                  style={{ fontSize: "16px" }}
                />
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 max-h-64 overflow-y-auto">
                {filteredCrops.map(c => (
                  <button key={c.name} type="button" onClick={() => handleCropChange(c.name)}
                    className="flex flex-col items-center gap-0.5 p-2 rounded-xl border-2 transition-all text-center"
                    style={selectedCrop === c.name
                      ? { background: c.bg, borderColor: c.accent, boxShadow: `0 0 0 2px ${c.accent}33` }
                      : { background: "#fff", borderColor: "#e5e7eb" }}>
                    <span className="text-xl">{c.emoji}</span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-gray-800 leading-tight">
                      {lang === "hi" ? c.hindi : c.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Land area */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-5">
              <label className="flex items-center gap-2 font-bold text-green-900 mb-3">
                <BarChart3 size={18} className="text-green-600" />
                {t(lang, "calcLandArea")}
              </label>
              <div className="flex gap-2">
                <input type="number" inputMode="decimal" min="0.1" step="0.5" value={landArea}
                  onChange={e => handleAreaChange(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-2xl border-2 border-green-200 bg-white text-green-900 font-bold outline-none focus:border-green-500"
                  style={{ fontSize: "16px" }} />
                <div className="flex rounded-2xl overflow-hidden border-2 border-green-200">
                  {(["bigha", "acre", "hectare"] as LandUnit[]).map(u => (
                    <button key={u} type="button" onClick={() => handleAreaChange(landArea, u)}
                      className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-bold transition-all"
                      style={unit === u ? { background: "#16a34a", color: "#fff" } : { background: "#fff", color: "#15803d" }}>
                      {unitLabel(u, lang)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Auto-filled hint */}
            {cropData && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-medium" style={{ background: cropData.bg, color: cropData.accent }}>
                <Info size={14} />
                {t(lang, "calcAutoFilled").replace("{crop}", lang === "hi" ? cropData.hindi : cropData.name)}
              </div>
            )}

            {/* Costs */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-5">
              <h3 className="flex items-center gap-2 font-bold text-green-900 mb-4">
                <Wallet size={18} className="text-red-500" />
                {t(lang, "calcExpenses")} ({"\u20B9"})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: <Wheat size={16} className="text-green-600" />, label: t(lang, "calcSeedCost"), val: seedCost, set: setSeedCost },
                  { icon: <Package size={16} className="text-cyan-600" />, label: t(lang, "calcFertCost"), val: fertCost, set: setFertCost },
                  { icon: <Users size={16} className="text-purple-600" />, label: t(lang, "calcLabourCost"), val: labourCost, set: setLabourCost },
                  { icon: <Droplets size={16} className="text-orange-500" />, label: t(lang, "calcIrriCost"), val: irriCost, set: setIrriCost },
                  { icon: <Coins size={16} className="text-gray-500" />, label: t(lang, "calcOtherCost"), val: otherCost, set: setOtherCost },
                ].map(inp => (
                  <div key={inp.label}>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1">{inp.icon} {inp.label}</label>
                    <input type="number" inputMode="numeric" min="0" value={inp.val}
                      onChange={e => { inp.set(e.target.value); setCalculated(false); }}
                      placeholder="0"
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-900 font-semibold outline-none focus:border-green-400 transition-colors"
                      style={{ fontSize: "16px" }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-5">
              <h3 className="flex items-center gap-2 font-bold text-green-900 mb-4">
                <TrendingUp size={18} className="text-green-600" />
                {t(lang, "calcRevenue")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">
                    {t(lang, "calcEstYield")} ({t(lang, "calcQuintal")})
                  </label>
                  <input type="number" inputMode="decimal" min="0" value={yieldQtl}
                    onChange={e => { setYieldQtl(e.target.value); setCalculated(false); }}
                    placeholder="0"
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-900 font-semibold outline-none focus:border-green-400 transition-colors"
                    style={{ fontSize: "16px" }} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">
                    {t(lang, "calcMsp")} ({"\u20B9"}/{t(lang, "calcQuintal")})
                  </label>
                  <input type="number" inputMode="numeric" min="0" value={priceQt}
                    onChange={e => { setPriceQt(e.target.value); setCalculated(false); }}
                    placeholder="0"
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-900 font-semibold outline-none focus:border-green-400 transition-colors"
                    style={{ fontSize: "16px" }} />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button type="button" onClick={() => setCalculated(true)} disabled={!selectedCrop}
                className="flex-1 flex items-center justify-center gap-2 font-extrabold py-4 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-base"
                style={{ background: "#16a34a", color: "#fff" }}>
                <Calculator size={20} /> {t(lang, "calcCalculate")}
              </button>
              <button type="button" onClick={reset}
                className="flex items-center justify-center gap-2 px-5 py-4 rounded-2xl border-2 border-green-200 text-green-700 font-bold hover:bg-green-50 transition-all active:scale-95 text-sm">
                <RotateCcw size={16} /> {t(lang, "calcReset")}
              </button>
            </div>
          </div>

          {/* RIGHT: Results */}
          <div className="lg:col-span-2 space-y-4">
            {!calculated && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mb-4">
                  <PieChart className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-sm text-gray-400 font-medium">{t(lang, "calcSelectCropFirst")}</p>
              </div>
            )}

            {calculated && selectedCrop && (
              <>
                {/* Profit/Loss hero */}
                <div className="rounded-3xl shadow-md border overflow-hidden card-animate"
                  style={{
                    borderColor: isProfit ? "#16a34a33" : "#dc262633",
                    background: isProfit ? "linear-gradient(135deg, #f0fdf4, #dcfce7)" : "linear-gradient(135deg, #fef2f2, #fee2e2)",
                  }}>
                  <div className="px-5 py-5 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="text-3xl">{cropData?.emoji}</span>
                      <span className="text-lg font-extrabold text-gray-900">
                        {lang === "hi" ? cropData?.hindi : cropData?.name}
                      </span>
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: isProfit ? "#16a34a" : "#dc2626" }}>
                      {isProfit ? t(lang, "calcProfit") : t(lang, "calcLoss")}
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      {isProfit ? <TrendingUp className="w-8 h-8 text-green-600" /> : <TrendingDown className="w-8 h-8 text-red-500" />}
                      <span className="text-3xl sm:text-4xl font-black" style={{ color: isProfit ? "#16a34a" : "#dc2626" }}>
                        {isProfit ? "+" : ""}{inr(profit)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {[
                        { label: t(lang, "calcProfitMargin"), value: `${margin.toFixed(1)}%`, color: isProfit ? "#16a34a" : "#dc2626" },
                        { label: t(lang, "calcROI"), value: `${roi.toFixed(1)}%`, color: "#7c3aed" },
                        { label: t(lang, "calcProfitPerArea").replace("{unit}", unitLabel(unit, lang)), value: inr(profitPerUnit), color: "#0891b2" },
                      ].map(s => (
                        <div key={s.label} className="bg-white/70 rounded-xl p-2">
                          <div className="text-[10px] font-bold text-gray-400 uppercase leading-tight">{s.label}</div>
                          <div className="text-sm sm:text-base font-extrabold" style={{ color: s.color }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Revenue vs Expense */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-5 card-animate" style={{ animationDelay: "0.1s" }}>
                  <h3 className="flex items-center gap-2 font-bold text-green-900 mb-3">
                    <BarChart3 size={16} className="text-green-600" /> {t(lang, "calcSummary")}
                  </h3>
                  <AnimBar pct={(totalExpense / Math.max(revenue, totalExpense, 1)) * 100} color="#ef4444" label={t(lang, "calcTotalExpense")} amount={inr(totalExpense)} />
                  <AnimBar pct={(revenue / Math.max(revenue, totalExpense, 1)) * 100} color="#16a34a" label={t(lang, "calcRevenue")} amount={inr(revenue)} />
                </div>

                {/* Donut */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-5 card-animate" style={{ animationDelay: "0.2s" }}>
                  <h3 className="flex items-center gap-2 font-bold text-green-900 mb-4">
                    <PieChart size={16} className="text-purple-500" /> {t(lang, "calcBreakdown")}
                  </h3>
                  <CostRing segments={costSegments} lang={lang} />
                </div>

                {/* Bars */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-5 card-animate" style={{ animationDelay: "0.3s" }}>
                  {costSegments.map(seg => (
                    <AnimBar key={seg.label} pct={(seg.value / maxCost) * 100} color={seg.color} label={seg.label} amount={inr(seg.value)} />
                  ))}
                </div>

                {/* Disclaimer */}
                <div className="flex items-start gap-2 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  <Info size={14} className="mt-0.5 shrink-0 text-amber-500" />
                  {t(lang, "calcDisclaimer")}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
