"use client";
import { useState } from "react";
import { Search, Droplets, Thermometer, Sprout, Sun } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";

type CropCategory = "Cereal" | "Pulse" | "Oilseed" | "Cash" | "Plantation" | "Spice" | "Fruit" | "Vegetable";

type Crop = {
  name: string; emoji: string; hindi: string;
  category: CropCategory;
  season: "Kharif" | "Rabi" | "Annual" | "Both";
  temp: string; water: string; soil: string;
  npk: string; duration: string;
  tips: string; accent: string; bg: string;
};

const CROPS: Crop[] = [
  // ── Cereals ──
  { name:"Rice",      emoji:"🌾", hindi:"धान",      category:"Cereal", season:"Kharif",  temp:"20-36°C", water:"High (1500mm+)", soil:"Clay-loam, waterlogged",    npk:"N 120, P 60, K 60",  duration:"120-150 days", accent:"#16a34a", bg:"#f0fdf4", tips:"Maintain 5 cm standing water. Transplant at 20-25 days." },
  { name:"Wheat",     emoji:"🌿", hindi:"गेहूँ",    category:"Cereal", season:"Rabi",    temp:"8-24°C",  water:"Med (450mm)",    soil:"Loam to clay-loam",         npk:"N 120, P 60, K 40",  duration:"110-130 days", accent:"#ca8a04", bg:"#fefce8", tips:"Sow Oct-Nov. Irrigate at crown root initiation stage." },
  { name:"Maize",     emoji:"🌽", hindi:"मक्का",    category:"Cereal", season:"Kharif",  temp:"18-34°C", water:"Med (500mm)",    soil:"Well-drained sandy loam",   npk:"N 150, P 75, K 75",  duration:"80-110 days",  accent:"#ea580c", bg:"#fff7ed", tips:"Thinning at 25 days keeps one plant per hill." },
  { name:"Barley",    emoji:"🌾", hindi:"जौ",       category:"Cereal", season:"Rabi",    temp:"5-22°C",  water:"Low (300mm)",    soil:"Sandy loam, alkaline OK",   npk:"N 60, P 30, K 20",   duration:"100-120 days", accent:"#92400e", bg:"#fef3c7", tips:"Most salt-tolerant cereal. Good for marginal lands." },
  { name:"Bajra",     emoji:"🌾", hindi:"बाजरा",    category:"Cereal", season:"Kharif",  temp:"25-42°C", water:"Low (300mm)",    soil:"Sandy, well-drained",       npk:"N 60, P 30, K 30",   duration:"70-90 days",   accent:"#d97706", bg:"#fffbeb", tips:"Best rainfed crop for arid zones. Very drought tolerant." },
  { name:"Jowar",     emoji:"🌾", hindi:"ज्वार",    category:"Cereal", season:"Both",    temp:"25-40°C", water:"Low-Med (400mm)",soil:"Deep black or loam",        npk:"N 80, P 40, K 40",   duration:"90-120 days",  accent:"#b45309", bg:"#fef3c7", tips:"Dual-purpose: grain + fodder. Ratoon gives 2nd harvest." },
  { name:"Ragi",      emoji:"🌾", hindi:"रागी",     category:"Cereal", season:"Kharif",  temp:"20-32°C", water:"Med (600mm)",    soil:"Red loam, laterite",        npk:"N 50, P 40, K 25",   duration:"90-120 days",  accent:"#dc2626", bg:"#fef2f2", tips:"Finger millet. High calcium. Ideal for Karnataka, TN hills." },

  // ── Pulses ──
  { name:"Chickpea",  emoji:"🟤", hindi:"चना",      category:"Pulse",  season:"Rabi",    temp:"8-27°C",  water:"Low (350mm)",    soil:"Sandy loam to clay",        npk:"N 20, P 50, K 20",   duration:"90-120 days",  accent:"#b45309", bg:"#fef3c7", tips:"Wilt-resistant varieties needed in endemic zones." },
  { name:"Lentil",    emoji:"🫘", hindi:"मसूर",     category:"Pulse",  season:"Rabi",    temp:"8-26°C",  water:"Low (300mm)",    soil:"Loam, avoid waterlogging",  npk:"N 20, P 40, K 20",   duration:"90-105 days",  accent:"#a16207", bg:"#fef9c3", tips:"Inoculate seeds with Rhizobium for better yield." },
  { name:"Peas",      emoji:"🟢", hindi:"मटर",      category:"Pulse",  season:"Rabi",    temp:"7-22°C",  water:"Med (400mm)",    soil:"Well-drained loam",         npk:"N 25, P 60, K 40",   duration:"90-120 days",  accent:"#16a34a", bg:"#f0fdf4", tips:"Sow October-November. Stake tall varieties." },

  // ── Oilseeds ──
  { name:"Soybean",   emoji:"🫘", hindi:"सोयाबीन", category:"Oilseed",season:"Kharif",  temp:"20-30°C", water:"Med (600mm)",    soil:"Loam to clay-loam",         npk:"N 30, P 60, K 40",   duration:"90-120 days",  accent:"#65a30d", bg:"#f7fee7", tips:"Rhizobium seed treatment boosts nitrogen fixation." },
  { name:"Groundnut", emoji:"🥜", hindi:"मूँगफली",  category:"Oilseed",season:"Kharif",  temp:"25-35°C", water:"Low (500mm)",    soil:"Sandy loam, well-drained",  npk:"N 25, P 50, K 50",   duration:"90-130 days",  accent:"#d97706", bg:"#fffbeb", tips:"Gypsum 500 kg/ha at pegging improves pod filling." },
  { name:"Mustard",   emoji:"🌼", hindi:"सरसों",    category:"Oilseed",season:"Rabi",    temp:"10-25°C", water:"Low (350mm)",    soil:"Loam, slightly alkaline",   npk:"N 60, P 40, K 20",   duration:"110-140 days", accent:"#eab308", bg:"#fefce8", tips:"Most important rabi oilseed. Irrigate at flowering." },
  { name:"Sunflower", emoji:"🌻", hindi:"सूरजमुखी", category:"Oilseed",season:"Both",    temp:"18-35°C", water:"Med (500mm)",    soil:"Well-drained loam",         npk:"N 80, P 60, K 30",   duration:"90-100 days",  accent:"#f59e0b", bg:"#fffbeb", tips:"Hybrid seeds give 30-40% more yield. Boron at bud stage." },
  { name:"Sesame",    emoji:"🌿", hindi:"तिल",      category:"Oilseed",season:"Kharif",  temp:"25-40°C", water:"Low (300mm)",    soil:"Light loam, well-drained",  npk:"N 40, P 20, K 20",   duration:"80-95 days",   accent:"#92400e", bg:"#fef3c7", tips:"Ancient crop. Great for rainfed farming. Short duration." },

  // ── Cash / Fiber ──
  { name:"Cotton",    emoji:"🤍", hindi:"कपास",    category:"Cash",   season:"Kharif",  temp:"25-35°C", water:"Med (700mm)",    soil:"Black cotton / deep clay",  npk:"N 100, P 50, K 50",  duration:"150-180 days", accent:"#0891b2", bg:"#f0f9ff", tips:"Avoid water-logging. Bollworm scouting weekly." },
  { name:"Sugarcane", emoji:"🍬", hindi:"गन्ना",    category:"Cash",   season:"Annual",  temp:"20-35°C", water:"High (2500mm)",  soil:"Deep loam to sandy loam",   npk:"N 250, P 100, K 120",duration:"365 days",     accent:"#9333ea", bg:"#faf5ff", tips:"Trash mulching conserves soil moisture effectively." },
  { name:"Jute",      emoji:"🧶", hindi:"जूट",      category:"Cash",   season:"Kharif",  temp:"24-37°C", water:"High (1500mm+)", soil:"Alluvial, loam",            npk:"N 60, P 30, K 30",   duration:"100-120 days", accent:"#65a30d", bg:"#f7fee7", tips:"Golden fibre. Sow March-May. Harvest before flowering." },
  { name:"Tobacco",   emoji:"🍂", hindi:"तम्बाकू",  category:"Cash",   season:"Rabi",    temp:"20-35°C", water:"Med (500mm)",    soil:"Sandy loam, light soil",    npk:"N 90, P 40, K 60",   duration:"90-120 days",  accent:"#78716c", bg:"#f5f5f4", tips:"Nursery Sept-Oct. Gujarat, AP, Karnataka major producers." },

  // ── Plantation ──
  { name:"Tea",       emoji:"🍵", hindi:"चाय",      category:"Plantation", season:"Annual", temp:"15-28°C", water:"High (1800mm+)", soil:"Acidic, well-drained hill", npk:"N 120, P 60, K 60", duration:"Perennial",    accent:"#15803d", bg:"#f0fdf4", tips:"Needs acidic soil pH 4.5-6. Assam & Darjeeling famous." },
  { name:"Coffee",    emoji:"☕", hindi:"कॉफ़ी",    category:"Plantation", season:"Annual", temp:"15-28°C", water:"High (1500mm+)", soil:"Volcanic, laterite",         npk:"N 100, P 50, K 100",duration:"Perennial",    accent:"#78350f", bg:"#fef3c7", tips:"Arabica at high altitude, Robusta at lower. Karnataka #1." },
  { name:"Rubber",    emoji:"🌳", hindi:"रबड़",     category:"Plantation", season:"Annual", temp:"22-35°C", water:"High (2000mm+)", soil:"Laterite, acid soil",         npk:"N 30, P 30, K 30 /tree", duration:"Perennial (6yr maturity)", accent:"#374151", bg:"#f3f4f6", tips:"Kerala produces 90% of India's rubber." },
  { name:"Coconut",   emoji:"🥥", hindi:"नारियल",   category:"Plantation", season:"Annual", temp:"24-37°C", water:"Med-High (1500mm)", soil:"Sandy loam, coastal",     npk:"N 50, P 32, K 120 /palm", duration:"Perennial",  accent:"#059669", bg:"#ecfdf5", tips:"175 trees/hectare. Kerala, Karnataka, TN, AP belt." },
  { name:"Arecanut",  emoji:"🌴", hindi:"सुपारी",   category:"Plantation", season:"Annual", temp:"22-35°C", water:"High (1500mm+)", soil:"Red laterite, loam",          npk:"N 100, P 40, K 140 /tree", duration:"Perennial", accent:"#0d9488", bg:"#f0fdfa", tips:"Karnataka is top producer. Regular irrigation essential." },
  { name:"Cashew",    emoji:"🥜", hindi:"काजू",     category:"Plantation", season:"Annual", temp:"24-38°C", water:"Low-Med (800mm)", soil:"Laterite, red sandy",         npk:"N 500, P 125, K 125 g/tree", duration:"Perennial (3yr fruit)", accent:"#c2410c", bg:"#fff7ed", tips:"Goa, Maharashtra, Kerala, Karnataka main areas." },

  // ── Spices ──
  { name:"BlackPepper",emoji:"⚫", hindi:"काली मिर्च",category:"Spice", season:"Annual",  temp:"20-32°C", water:"High (2000mm+)", soil:"Virgin forest, laterite",     npk:"N 50, P 50, K 150 g/vine", duration:"Perennial",  accent:"#1c1917", bg:"#f5f5f4", tips:"King of spices. Kerala & Karnataka. Needs support trees." },
  { name:"Cardamom",  emoji:"💚", hindi:"इलायची",   category:"Spice",  season:"Annual",  temp:"15-28°C", water:"High (2000mm+)", soil:"Forest loam, shaded",         npk:"N 75, P 75, K 150 g/clump",duration:"Perennial",  accent:"#15803d", bg:"#f0fdf4", tips:"Queen of spices. Kerala, TN & Karnataka hills." },
  { name:"Clove",     emoji:"🟤", hindi:"लौंग",     category:"Spice",  season:"Annual",  temp:"22-32°C", water:"High (1500mm+)", soil:"Rich loam, volcanic",         npk:"N 20, P 18, K 50 g",duration:"Perennial (5yr)", accent:"#92400e", bg:"#fef3c7", tips:"Tamil Nadu, Kerala, Karnataka. Harvest at pink bud stage." },
  { name:"Ginger",    emoji:"🫚", hindi:"अदरक",     category:"Spice",  season:"Kharif",  temp:"20-32°C", water:"High (1500mm)",  soil:"Rich loamy, well-drained",   npk:"N 75, P 50, K 50",   duration:"240-260 days", accent:"#d97706", bg:"#fffbeb", tips:"Plant April-May. Kerala, NE states, Karnataka main areas." },
  { name:"Turmeric",  emoji:"🟡", hindi:"हल्दी",    category:"Spice",  season:"Kharif",  temp:"20-35°C", water:"High (1200mm+)", soil:"Clay-loam, well-drained",    npk:"N 60, P 50, K 120",  duration:"240-270 days", accent:"#ca8a04", bg:"#fefce8", tips:"Telangana, Maharashtra, TN, AP. Earthing up at 40 & 60 days." },
  { name:"Garlic",    emoji:"🧄", hindi:"लहसुन",    category:"Spice",  season:"Rabi",    temp:"10-25°C", water:"Low (400mm)",    soil:"Loam, well-drained",         npk:"N 50, P 50, K 50",   duration:"120-150 days", accent:"#9333ea", bg:"#faf5ff", tips:"MP, Gujarat, Rajasthan major producers. Plant Oct-Nov." },
  { name:"Coriander", emoji:"🌿", hindi:"धनिया",    category:"Spice",  season:"Rabi",    temp:"15-28°C", water:"Low (350mm)",    soil:"Well-drained loam",          npk:"N 40, P 20, K 20",   duration:"90-120 days",  accent:"#65a30d", bg:"#f7fee7", tips:"Rajasthan, MP, Gujarat main producers. Dual use: seed + leaf." },
  { name:"Cumin",     emoji:"🟤", hindi:"जीरा",     category:"Spice",  season:"Rabi",    temp:"20-35°C", water:"Low (250mm)",    soil:"Sandy loam, alkaline OK",    npk:"N 30, P 20, K 0",    duration:"100-120 days", accent:"#a16207", bg:"#fef9c3", tips:"Gujarat & Rajasthan produce 80% of India's cumin." },
  { name:"Chilli",    emoji:"🌶️",hindi:"मिर्च",    category:"Spice",  season:"Both",    temp:"20-35°C", water:"Med (600mm)",    soil:"Loam, well-drained",         npk:"N 100, P 50, K 50",  duration:"120-150 days", accent:"#dc2626", bg:"#fef2f2", tips:"AP, Telangana, Karnataka major producers. Drip saves 40% water." },

  // ── Fruits ──
  { name:"Mango",     emoji:"🥭", hindi:"आम",       category:"Fruit",  season:"Annual",  temp:"24-45°C", water:"Low-Med (750mm)", soil:"Deep well-drained alluvial", npk:"N 100, P 50, K 100 /tree", duration:"5-8 yrs bear",  accent:"#d97706", bg:"#fffbeb", tips:"Pruning after harvest improves next season fruit set." },
  { name:"Banana",    emoji:"🍌", hindi:"केला",      category:"Fruit",  season:"Annual",  temp:"22-38°C", water:"High (1500mm+)", soil:"Rich loam, alluvial",         npk:"N 200, P 60, K 300 g/plant", duration:"12-14 months", accent:"#eab308", bg:"#fefce8", tips:"TN, Maharashtra, Gujarat, AP. Drip + fertigation ideal." },
  { name:"Papaya",    emoji:"🍈", hindi:"पपीता",    category:"Fruit",  season:"Annual",  temp:"22-38°C", water:"Med (1000mm)",   soil:"Well-drained loam",          npk:"N 200, P 200, K 250 g/plant", duration:"9-12 months", accent:"#f97316", bg:"#fff7ed", tips:"Bears fruit within 9 months. CV Pusa Dwarf popular." },
  { name:"Guava",     emoji:"🍐", hindi:"अमरूद",    category:"Fruit",  season:"Annual",  temp:"20-38°C", water:"Low-Med (600mm)", soil:"Tolerates many soil types",  npk:"N 260, P 320, K 260 g/tree", duration:"2-3 yrs bear", accent:"#65a30d", bg:"#f7fee7", tips:"Hardy fruit. UP, MP, Bihar major producers. Prune yearly." },
  { name:"Pomegranate",emoji:"🔴", hindi:"अनार",    category:"Fruit",  season:"Annual",  temp:"22-40°C", water:"Low (500mm)",    soil:"Well-drained, semi-arid",    npk:"N 250, P 125, K 125 g/plant", duration:"2-3 yrs bear", accent:"#dc2626", bg:"#fef2f2", tips:"Maharashtra #1. Drip irrigation. Bahar treatment for timing." },
  { name:"Grape",     emoji:"🍇", hindi:"अंगूर",    category:"Fruit",  season:"Annual",  temp:"18-38°C", water:"Med (700mm)",    soil:"Deep loam, well-drained",    npk:"N 500, P 700, K 700 g/vine", duration:"2 yrs bear",  accent:"#7c3aed", bg:"#faf5ff", tips:"Maharashtra, Karnataka dominate. Thompson Seedless #1 variety." },
  { name:"Orange",    emoji:"🍊", hindi:"संतरा",    category:"Fruit",  season:"Annual",  temp:"18-35°C", water:"Med (800mm)",    soil:"Loam, well-drained",         npk:"N 600, P 200, K 250 g/tree", duration:"3-4 yrs bear", accent:"#ea580c", bg:"#fff7ed", tips:"Nagpur & Coorg famous. Zinc + boron sprays essential." },
  { name:"Watermelon",emoji:"🍉", hindi:"तरबूज",    category:"Fruit",  season:"Both",    temp:"25-42°C", water:"Low-Med (400mm)", soil:"Sandy loam, river beds",     npk:"N 100, P 50, K 50",  duration:"70-90 days",   accent:"#dc2626", bg:"#fef2f2", tips:"Feb-Mar sowing. River bank cultivation popular in UP, Rajasthan." },
  { name:"Jackfruit", emoji:"🍈", hindi:"कटहल",     category:"Fruit",  season:"Annual",  temp:"22-38°C", water:"Med (1000mm)",   soil:"Deep loam, laterite",        npk:"N 30, P 10, K 30 g (yr 1)", duration:"4-5 yrs bear", accent:"#65a30d", bg:"#f7fee7", tips:"Low maintenance tree. Kerala state fruit. Huge yield potential." },

  // ── Vegetables ──
  { name:"Tomato",    emoji:"🍅", hindi:"टमाटर",    category:"Vegetable", season:"Both", temp:"18-32°C", water:"Med (600mm)",    soil:"Loam, well-drained",         npk:"N 120, P 80, K 80",  duration:"60-90 days",   accent:"#dc2626", bg:"#fef2f2", tips:"Nursery + transplant. Calcium spray prevents blossom-end rot." },
  { name:"Onion",     emoji:"🧅", hindi:"प्याज",    category:"Vegetable", season:"Both", temp:"12-28°C", water:"Med (500mm)",    soil:"Loam, well-drained",         npk:"N 100, P 50, K 50",  duration:"90-150 days",  accent:"#9333ea", bg:"#faf5ff", tips:"Maharashtra #1. Kharif, Late Kharif & Rabi seasons." },
  { name:"Potato",    emoji:"🥔", hindi:"आलू",      category:"Vegetable", season:"Rabi", temp:"10-25°C", water:"Med (500mm)",    soil:"Sandy loam, slightly acidic",npk:"N 150, P 80, K 100",  duration:"75-100 days",  accent:"#a16207", bg:"#fef9c3", tips:"UP, WB, Bihar major producers. Certified seed essential." },
  { name:"Brinjal",   emoji:"🍆", hindi:"बैंगन",    category:"Vegetable", season:"Both", temp:"20-35°C", water:"Med (500mm)",    soil:"Loam, well-drained",         npk:"N 100, P 50, K 50",  duration:"60-80 days",   accent:"#7c3aed", bg:"#faf5ff", tips:"King of vegetables in India. WB, Odisha, Bihar lead." },
  { name:"Cabbage",   emoji:"🥬", hindi:"पत्तागोभी", category:"Vegetable", season:"Rabi", temp:"10-22°C", water:"Med (400mm)",   soil:"Loam, moisture-retentive",   npk:"N 120, P 60, K 60",  duration:"60-90 days",   accent:"#0891b2", bg:"#f0f9ff", tips:"Cool season crop. Boron 1 kg/ha prevents hollow stem." },
  { name:"Cauliflower",emoji:"🤍", hindi:"फूलगोभी",  category:"Vegetable", season:"Rabi", temp:"10-22°C", water:"Med (400mm)",   soil:"Loam, rich in organic matter",npk:"N 120, P 60, K 60", duration:"50-90 days",   accent:"#6366f1", bg:"#eef2ff", tips:"Early, main & late groups. Molybdenum prevents whiptail." },
  { name:"Okra",      emoji:"🟢", hindi:"भिंडी",    category:"Vegetable", season:"Both", temp:"24-38°C", water:"Med (500mm)",    soil:"Loam, well-drained",         npk:"N 60, P 30, K 30",   duration:"45-65 days",   accent:"#16a34a", bg:"#f0fdf4", tips:"Pick every 2 days. Summer & Kharif seasons. Very fast crop." },
];

const CATEGORIES: CropCategory[] = ["Cereal", "Pulse", "Oilseed", "Cash", "Plantation", "Spice", "Fruit", "Vegetable"];
const SEASONS = ["All", "Kharif", "Rabi", "Annual", "Both"] as const;

const CATEGORY_EMOJI: Record<CropCategory, string> = {
  Cereal: "🌾", Pulse: "🫘", Oilseed: "🌻", Cash: "💰",
  Plantation: "🌴", Spice: "🌶️", Fruit: "🍎", Vegetable: "🥬",
};
const CATEGORY_LABEL_HI: Record<CropCategory, string> = {
  Cereal: "अनाज", Pulse: "दालें", Oilseed: "तिलहन", Cash: "नकदी",
  Plantation: "बागान", Spice: "मसाले", Fruit: "फल", Vegetable: "सब्ज़ी",
};
const SEASON_LABEL: Record<(typeof SEASONS)[number], { hi: string; en: string }> = {
  All:     { hi: "सभी",      en: "All" },
  Kharif:  { hi: "खरीफ",    en: "Kharif" },
  Rabi:    { hi: "रबी",      en: "Rabi" },
  Annual:  { hi: "बारहमासी", en: "Annual" },
  Both:    { hi: "दोनों",    en: "Both" },
};

export default function CropsPage() {
  const { lang } = useLanguage();
  const [search, setSearch] = useState("");
  const [season, setSeason] = useState<(typeof SEASONS)[number]>("All");
  const [category, setCategory] = useState<CropCategory | "All">("All");

  const visible = CROPS.filter(c =>
    (season === "All" || c.season === season) &&
    (category === "All" || c.category === category) &&
    (search.trim() === "" || c.name.toLowerCase().includes(search.trim().toLowerCase()) || c.hindi.includes(search.trim()))
  );

  return (
    <div>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #14532d, #15803d)" }} className="pt-24 pb-8 sm:pt-32 sm:pb-10 px-4">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white mb-1">{"📚"} {t(lang, "cropsTitle")}</h1>
          <p className="text-green-200 text-xs sm:text-sm">{t(lang, "cropsSub")}</p>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="bg-green-400/20 text-green-200 text-xs font-bold px-3 py-1 rounded-full">
              {CROPS.length} {lang === "hi" ? "फसलें" : "Crops"}
            </span>
            <span className="bg-green-400/20 text-green-200 text-xs font-bold px-3 py-1 rounded-full">
              {CATEGORIES.length} {lang === "hi" ? "श्रेणियाँ" : "Categories"}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-3 sm:px-4 py-4 sm:py-6">
        {/* Filter bar */}
        <div className="flex flex-col gap-3 mb-5 sm:mb-6">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-green-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t(lang, "cropsSearch")}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-green-200 bg-white text-green-900 placeholder:text-green-300 outline-none focus:border-green-500"
              style={{ fontSize: "16px" }} />
          </div>

          {/* Category chips */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button type="button" onClick={() => setCategory("All")}
              className="shrink-0 px-3 py-2 rounded-2xl text-xs font-bold border-2 transition-all"
              style={category === "All"
                ? { background: "#16a34a", color: "#fff", borderColor: "#16a34a" }
                : { background: "#fff", color: "#15803d", borderColor: "#bbf7d0" }}>
              {lang === "hi" ? "सभी" : "All"}
            </button>
            {CATEGORIES.map(cat => (
              <button key={cat} type="button" onClick={() => setCategory(cat)}
                className="shrink-0 px-3 py-2 rounded-2xl text-xs font-bold border-2 transition-all flex items-center gap-1"
                style={category === cat
                  ? { background: "#16a34a", color: "#fff", borderColor: "#16a34a" }
                  : { background: "#fff", color: "#15803d", borderColor: "#bbf7d0" }}>
                <span>{CATEGORY_EMOJI[cat]}</span>
                {lang === "hi" ? CATEGORY_LABEL_HI[cat] : cat}
              </button>
            ))}
          </div>

          {/* Season chips */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {SEASONS.map(s => (
              <button key={s} type="button" onClick={() => setSeason(s)}
                className="shrink-0 px-4 py-2.5 rounded-2xl text-sm font-bold border-2 transition-all"
                style={season === s
                  ? { background: "#16a34a", color: "#fff", borderColor: "#16a34a" }
                  : { background: "#fff", color: "#15803d", borderColor: "#bbf7d0" }}>
                {lang === "hi" ? SEASON_LABEL[s].hi : SEASON_LABEL[s].en}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="mb-3 text-xs font-semibold text-green-600">
          {visible.length} / {CROPS.length} {lang === "hi" ? "फसलें दिख रही हैं" : "crops shown"}
        </div>

        {visible.length === 0 && (
          <div className="text-center py-12 sm:py-16 text-green-400">
            <span className="text-4xl sm:text-5xl">{"🔍"}</span>
            <p className="mt-3 text-sm font-medium">{t(lang, "cropsNone")}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {visible.map(c => (
            <div key={c.name} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
              style={{ borderLeftWidth: 5, borderLeftColor: c.accent }}>
              {/* Header */}
              <div className="px-4 sm:px-5 pt-4 pb-3 flex items-center gap-3" style={{ background: c.bg }}>
                <span className="text-3xl sm:text-4xl">{c.emoji}</span>
                <div>
                  <div className="font-extrabold text-gray-900 text-base sm:text-lg leading-tight">{c.hindi}</div>
                  <div className="text-xs sm:text-sm font-medium" style={{ color: c.accent }}>{c.name}</div>
                </div>
                <div className="ml-auto flex flex-col gap-1 items-end">
                  <span className="px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold text-white badge-sm" style={{ background: c.accent }}>
                    {c.season}
                  </span>
                  <span className="text-[10px] font-medium text-gray-400">
                    {lang === "hi" ? CATEGORY_LABEL_HI[c.category] : c.category}
                  </span>
                </div>
              </div>

              {/* Stat grid */}
              <div className="grid grid-cols-2 divide-x divide-y divide-gray-100">
                {[
                  { icon: <Thermometer size={14} className="text-red-400" />, label: t(lang, "cropTemp"), val: c.temp },
                  { icon: <Droplets size={14} className="text-blue-400" />,   label: t(lang, "cropWater"),  val: c.water },
                  { icon: <Sprout size={14} className="text-green-500" />,    label: t(lang, "cropNpk"),   val: c.npk },
                  { icon: <Sun size={14} className="text-amber-400" />,       label: t(lang, "cropDuration"),   val: c.duration },
                ].map(({ icon, label, val }) => (
                  <div key={label} className="px-3 sm:px-4 py-2.5 sm:py-3 flex items-start gap-2">
                    <div className="mt-0.5 shrink-0">{icon}</div>
                    <div>
                      <div className="text-[10px] sm:text-xs text-gray-400 font-semibold uppercase tracking-wide">{label}</div>
                      <div className="text-xs sm:text-sm font-bold text-gray-800">{val}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Soil + tip */}
              <div className="px-4 sm:px-5 py-2.5 sm:py-3 border-t border-gray-100">
                <div className="text-[10px] sm:text-xs text-gray-500 font-semibold uppercase tracking-wide mb-0.5">{t(lang, "cropSoil")}</div>
                <div className="text-xs sm:text-sm text-gray-700">{c.soil}</div>
              </div>
              <div className="px-4 sm:px-5 pb-3 sm:pb-4">
                <div className="text-[10px] sm:text-xs text-gray-500 font-semibold uppercase tracking-wide mb-0.5">{t(lang, "cropTip")}</div>
                <div className="text-xs sm:text-sm text-gray-700 leading-snug">{c.tips}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
