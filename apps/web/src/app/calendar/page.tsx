"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Search, Sprout, Scissors, Info, Filter, Star } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";

/* ── Crop Calendar Entry ── */
type Season = "Kharif" | "Rabi" | "Zaid" | "Perennial";
type CalEntry = {
  crop: string;
  cropHi: string;
  emoji: string;
  season: Season;
  sowMonths: number[];   // 0-indexed (0=Jan, 11=Dec)
  harvestMonths: number[];
  duration: string;
  durationHi: string;
  tip: string;
  tipHi: string;
  category: string;
};

const MONTH_KEYS = ["calJan","calFeb","calMar","calApr","calMay","calJun","calJul","calAug","calSep","calOct","calNov","calDec"] as const;

const CALENDAR: CalEntry[] = [
  // Kharif crops (June-July sowing → Oct-Dec harvest)
  { crop:"Rice", cropHi:"धान", emoji:"🌾", season:"Kharif", sowMonths:[5,6], harvestMonths:[9,10], duration:"120-150 days", durationHi:"120-150 दिन", tip:"Transplant 25-30 day old seedlings for best results.", tipHi:"25-30 दिन पुरानी पौध रोपाई करें।", category:"Cereal" },
  { crop:"Maize", cropHi:"मक्का", emoji:"🌽", season:"Kharif", sowMonths:[5,6], harvestMonths:[8,9], duration:"80-110 days", durationHi:"80-110 दिन", tip:"Sow after first monsoon rain with 60×20cm spacing.", tipHi:"पहली बारिश के बाद 60×20cm दूरी पर बुवाई करें।", category:"Cereal" },
  { crop:"Bajra", cropHi:"बाजरा", emoji:"🌾", season:"Kharif", sowMonths:[5,6], harvestMonths:[8,9], duration:"70-90 days", durationHi:"70-90 दिन", tip:"Drought-tolerant, ideal for sandy soils.", tipHi:"सूखा सहनशील, रेतीली मिट्टी के लिए आदर्श।", category:"Cereal" },
  { crop:"Jowar", cropHi:"ज्वार", emoji:"🌾", season:"Kharif", sowMonths:[5,6], harvestMonths:[9,10], duration:"100-120 days", durationHi:"100-120 दिन", tip:"Good for both grain and fodder.", tipHi:"अनाज और चारा दोनों के लिए अच्छा।", category:"Cereal" },
  { crop:"Cotton", cropHi:"कपास", emoji:"🤍", season:"Kharif", sowMonths:[3,4,5], harvestMonths:[9,10,11], duration:"150-180 days", durationHi:"150-180 दिन", tip:"Use Bt cotton varieties for bollworm resistance.", tipHi:"बॉलवर्म से बचाव के लिए Bt कपास लगाएँ।", category:"Cash" },
  { crop:"Soybean", cropHi:"सोयाबीन", emoji:"🫘", season:"Kharif", sowMonths:[5,6], harvestMonths:[9,10], duration:"90-120 days", durationHi:"90-120 दिन", tip:"Seed treatment with Rhizobium improves nitrogen fixation.", tipHi:"राइज़ोबियम से बीजोपचार नाइट्रोजन बढ़ाता है।", category:"Oilseed" },
  { crop:"Groundnut", cropHi:"मूँगफली", emoji:"🥜", season:"Kharif", sowMonths:[5,6], harvestMonths:[9,10], duration:"100-130 days", durationHi:"100-130 दिन", tip:"Do earthing up at 30 and 60 days after sowing.", tipHi:"बुवाई के 30 और 60 दिन बाद मिट्टी चढ़ाएँ।", category:"Oilseed" },
  { crop:"Sesame", cropHi:"तिल", emoji:"🌿", season:"Kharif", sowMonths:[5,6], harvestMonths:[8,9], duration:"80-95 days", durationHi:"80-95 दिन", tip:"Don't overwater — sesame is sensitive to waterlogging.", tipHi:"अधिक पानी न दें — तिल जलभराव सहन नहीं करता।", category:"Oilseed" },
  { crop:"Jute", cropHi:"जूट", emoji:"🧶", season:"Kharif", sowMonths:[2,3,4], harvestMonths:[6,7,8], duration:"120-150 days", durationHi:"120-150 दिन", tip:"Needs warm humid climate, abundant water.", tipHi:"गर्म नम जलवायु और भरपूर पानी चाहिए।", category:"Cash" },
  { crop:"Ragi", cropHi:"रागी", emoji:"🌾", season:"Kharif", sowMonths:[4,5,6], harvestMonths:[8,9,10], duration:"100-130 days", durationHi:"100-130 दिन", tip:"Finger millet grows well in upland red soils.", tipHi:"ऊँची लाल मिट्टी में अच्छी तरह उगता है।", category:"Cereal" },

  // Rabi crops (Oct-Nov sowing → Feb-Apr harvest)
  { crop:"Wheat", cropHi:"गेहूँ", emoji:"🌿", season:"Rabi", sowMonths:[9,10], harvestMonths:[2,3], duration:"120-150 days", durationHi:"120-150 दिन", tip:"Timely sowing (Nov 1-25) is critical for best yield.", tipHi:"समय पर बुवाई (1-25 नवंबर) सबसे अच्छी उपज के लिए ज़रूरी।", category:"Cereal" },
  { crop:"Barley", cropHi:"जौ", emoji:"🌾", season:"Rabi", sowMonths:[9,10], harvestMonths:[2,3], duration:"110-140 days", durationHi:"110-140 दिन", tip:"More drought-tolerant than wheat, good for poor soils.", tipHi:"गेहूँ से ज़्यादा सूखा सहनशील, कमज़ोर मिट्टी के लिए अच्छा।", category:"Cereal" },
  { crop:"Chickpea", cropHi:"चना", emoji:"🟤", season:"Rabi", sowMonths:[9,10], harvestMonths:[1,2,3], duration:"90-120 days", durationHi:"90-120 दिन", tip:"Avoid excessive irrigation — one or two irrigations enough.", tipHi:"अधिक सिंचाई से बचें — एक-दो सिंचाई काफी।", category:"Pulse" },
  { crop:"Lentil", cropHi:"मसूर", emoji:"🫘", season:"Rabi", sowMonths:[9,10], harvestMonths:[1,2,3], duration:"100-120 days", durationHi:"100-120 दिन", tip:"Rain-fed crop, minimal irrigation needed.", tipHi:"वर्षा-आधारित फसल, न्यूनतम सिंचाई ज़रूरत।", category:"Pulse" },
  { crop:"Peas", cropHi:"मटर", emoji:"🟢", season:"Rabi", sowMonths:[9,10], harvestMonths:[1,2], duration:"90-120 days", durationHi:"90-120 दिन", tip:"Pick pods every 2-3 days for continuous harvest.", tipHi:"लगातार कटाई के लिए हर 2-3 दिन में तोड़ें।", category:"Pulse" },
  { crop:"Mustard", cropHi:"सरसों", emoji:"🌼", season:"Rabi", sowMonths:[9,10], harvestMonths:[1,2], duration:"110-140 days", durationHi:"110-140 दिन", tip:"First irrigation at rosette stage is critical.", tipHi:"रोज़ेट अवस्था में पहली सिंचाई बहुत ज़रूरी।", category:"Oilseed" },
  { crop:"Sunflower", cropHi:"सूरजमुखी", emoji:"🌻", season:"Rabi", sowMonths:[9,10,1], harvestMonths:[1,2,4], duration:"80-100 days", durationHi:"80-100 दिन", tip:"Pollination requires bee activity — avoid insecticides during flowering.", tipHi:"परागण के लिए मधुमक्खी ज़रूरी — फूल के समय कीटनाशक न डालें।", category:"Oilseed" },
  { crop:"Coriander", cropHi:"धनिया", emoji:"🌿", season:"Rabi", sowMonths:[9,10], harvestMonths:[1,2], duration:"90-110 days", durationHi:"90-110 दिन", tip:"Soak seeds overnight for better germination.", tipHi:"बेहतर अंकुरण के लिए बीज रात भर भिगोएँ।", category:"Spice" },
  { crop:"Cumin", cropHi:"जीरा", emoji:"🟤", season:"Rabi", sowMonths:[10,11], harvestMonths:[1,2], duration:"100-120 days", durationHi:"100-120 दिन", tip:"Avoid heavy watering — prone to blight disease.", tipHi:"भारी पानी न दें — झुलसा रोग का खतरा।", category:"Spice" },
  { crop:"Garlic", cropHi:"लहसुन", emoji:"🧄", season:"Rabi", sowMonths:[9,10], harvestMonths:[1,2,3], duration:"120-150 days", durationHi:"120-150 दिन", tip:"Plant individual cloves 10cm apart in rows.", tipHi:"कलियाँ पंक्ति में 10cm दूरी पर लगाएँ।", category:"Spice" },

  // Zaid crops (Feb-Mar sowing → May-Jun harvest)
  { crop:"Watermelon", cropHi:"तरबूज", emoji:"🍉", season:"Zaid", sowMonths:[1,2], harvestMonths:[4,5], duration:"70-90 days", durationHi:"70-90 दिन", tip:"Use mulch to retain soil moisture and suppress weeds.", tipHi:"नमी बनाए रखने और खरपतवार रोकने के लिए मल्च डालें।", category:"Fruit" },
  { crop:"Okra", cropHi:"भिंडी", emoji:"🟢", season:"Zaid", sowMonths:[1,2,5,6], harvestMonths:[3,4,7,8], duration:"45-65 days", durationHi:"45-65 दिन", tip:"Pick tender pods daily — overripe pods become fibrous.", tipHi:"रोज़ कोमल फलियाँ तोड़ें — पकने पर रेशेदार हो जाती हैं।", category:"Vegetable" },
  { crop:"Tomato", cropHi:"टमाटर", emoji:"🍅", season:"Zaid", sowMonths:[0,1,5,6], harvestMonths:[3,4,8,9], duration:"70-90 days", durationHi:"70-90 दिन", tip:"Stake plants for better air circulation and fruit quality.", tipHi:"बेहतर हवा और फल गुणवत्ता के लिए पौधों को सहारा दें।", category:"Vegetable" },
  { crop:"Brinjal", cropHi:"बैंगन", emoji:"🍆", season:"Zaid", sowMonths:[1,2,5,6], harvestMonths:[4,5,8,9], duration:"60-85 days", durationHi:"60-85 दिन", tip:"Regular harvesting promotes more fruiting.", tipHi:"नियमित तुड़ाई से अधिक फल आते हैं।", category:"Vegetable" },
  { crop:"Cauliflower", cropHi:"फूलगोभी", emoji:"🤍", season:"Rabi", sowMonths:[8,9,10], harvestMonths:[11,0,1,2], duration:"60-100 days", durationHi:"60-100 दिन", tip:"Cover curds with leaves to keep them white.", tipHi:"सफ़ेद रखने के लिए पत्तों से फूल ढकें।", category:"Vegetable" },
  { crop:"Cabbage", cropHi:"पत्तागोभी", emoji:"🥬", season:"Rabi", sowMonths:[8,9,10], harvestMonths:[11,0,1,2], duration:"60-90 days", durationHi:"60-90 दिन", tip:"Rich compost before transplanting improves head formation.", tipHi:"रोपाई से पहले भरपूर खाद डालने से बंद गोभी अच्छी बनती है।", category:"Vegetable" },
  { crop:"Onion", cropHi:"प्याज", emoji:"🧅", season:"Rabi", sowMonths:[9,10,11], harvestMonths:[2,3,4], duration:"120-150 days", durationHi:"120-150 दिन", tip:"Stop irrigation 10 days before harvesting for better storage.", tipHi:"कटाई से 10 दिन पहले पानी बंद करें — स्टोरेज बेहतर होगा।", category:"Vegetable" },
  { crop:"Potato", cropHi:"आलू", emoji:"🥔", season:"Rabi", sowMonths:[9,10], harvestMonths:[1,2], duration:"75-120 days", durationHi:"75-120 दिन", tip:"Use certified disease-free seed potatoes.", tipHi:"प्रमाणित रोग-मुक्त बीज आलू इस्तेमाल करें।", category:"Vegetable" },

  // Perennial / Year-round
  { crop:"Sugarcane", cropHi:"गन्ना", emoji:"🍬", season:"Perennial", sowMonths:[1,2,9,10], harvestMonths:[10,11,0,1,2,3], duration:"10-14 months", durationHi:"10-14 महीने", tip:"Autumn planting (Oct) gives 10-15% higher yield than spring.", tipHi:"शरद बुवाई (अक्टूबर) बसंत से 10-15% ज़्यादा उपज देती है।", category:"Cash" },
  { crop:"Turmeric", cropHi:"हल्दी", emoji:"🟡", season:"Kharif", sowMonths:[4,5], harvestMonths:[0,1,2], duration:"7-9 months", durationHi:"7-9 महीने", tip:"Mulch with dry leaves after planting for moisture retention.", tipHi:"रोपण के बाद सूखी पत्तियों से मल्चिंग करें।", category:"Spice" },
  { crop:"Ginger", cropHi:"अदरक", emoji:"🫚", season:"Kharif", sowMonths:[2,3,4], harvestMonths:[11,0,1], duration:"8-10 months", durationHi:"8-10 महीने", tip:"Shade-loving — intercrop with pigeon pea or maize.", tipHi:"छाया पसंद — अरहर या मक्का के साथ अंतरफसल करें।", category:"Spice" },
  { crop:"Chilli", cropHi:"मिर्च", emoji:"🌶️", season:"Kharif", sowMonths:[5,6,7], harvestMonths:[9,10,11,0], duration:"90-120 days", durationHi:"90-120 दिन", tip:"Picking ripe fruits every week encourages more flowering.", tipHi:"हर हफ्ते पकी मिर्च तोड़ने से और फूल आते हैं।", category:"Spice" },
  { crop:"Banana", cropHi:"केला", emoji:"🍌", season:"Perennial", sowMonths:[1,2,5,6], harvestMonths:[10,11,0,1,4,5], duration:"11-14 months", durationHi:"11-14 महीने", tip:"Prop bunches with bamboo to prevent stem breaking.", tipHi:"तने टूटने से बचाने के लिए गुच्छों को बांस से सहारा दें।", category:"Fruit" },
  { crop:"Papaya", cropHi:"पपीता", emoji:"🍈", season:"Perennial", sowMonths:[1,2,5,6,8,9], harvestMonths:[0,1,2,3,4,5,6,7,8,9,10,11], duration:"8-10 months", durationHi:"8-10 महीने", tip:"Plant in raised beds to avoid waterlogging.", tipHi:"जलभराव से बचने के लिए ऊँची क्यारियों में लगाएँ।", category:"Fruit" },
  { crop:"Mango", cropHi:"आम", emoji:"🥭", season:"Perennial", sowMonths:[6,7,8], harvestMonths:[3,4,5,6], duration:"3-6 years first fruit", durationHi:"3-6 साल पहली फसल", tip:"Prune old branches after harvest for better next-year yield.", tipHi:"कटाई के बाद पुरानी शाखाएँ काटें — अगली बार उपज बढ़ेगी।", category:"Fruit" },
  { crop:"Guava", cropHi:"अमरूद", emoji:"🍐", season:"Perennial", sowMonths:[1,2,6,7], harvestMonths:[7,8,9,10,11,0], duration:"2-3 years first fruit", durationHi:"2-3 साल पहली फसल", tip:"Two fruiting seasons — monsoon (Aug-Sep) and winter (Nov-Feb).", tipHi:"दो फलन — वर्षा (अग-सित) और शीत (नव-फर)।", category:"Fruit" },
  { crop:"Coconut", cropHi:"नारियल", emoji:"🥥", season:"Perennial", sowMonths:[5,6,7,8,9], harvestMonths:[0,1,2,3,4,5,6,7,8,9,10,11], duration:"5-6 years first fruit", durationHi:"5-6 साल पहली फसल", tip:"Apply salt in basin to prevent crown rot.", tipHi:"क्राउन रॉट रोकने के लिए थाले में नमक डालें।", category:"Plantation" },
  { crop:"Tea", cropHi:"चाय", emoji:"🍵", season:"Perennial", sowMonths:[5,6,7,8,9,10], harvestMonths:[2,3,4,5,6,7,8,9,10], duration:"3-5 years first harvest", durationHi:"3-5 साल पहली कटाई", tip:"Pluck two leaves and a bud for premium quality.", tipHi:"प्रीमियम गुणवत्ता के लिए दो पत्ती और एक कली तोड़ें।", category:"Plantation" },
  { crop:"Coffee", cropHi:"कॉफ़ी", emoji:"☕", season:"Perennial", sowMonths:[4,5,6], harvestMonths:[10,11,0,1], duration:"3-4 years first harvest", durationHi:"3-4 साल पहली कटाई", tip:"Grow under shade trees — silver oak is ideal.", tipHi:"छायादार पेड़ों के नीचे उगाएँ — सिल्वर ओक आदर्श।", category:"Plantation" },
  { crop:"Tobacco", cropHi:"तम्बाकू", emoji:"🍂", season:"Rabi", sowMonths:[8,9], harvestMonths:[0,1,2], duration:"100-120 days", durationHi:"100-120 दिन", tip:"Topping and desuckering increase leaf quality.", tipHi:"टॉपिंग और डिसकरिंग से पत्ती गुणवत्ता बढ़ती है।", category:"Cash" },
];

const SEASON_COLORS: Record<Season, { color: string; bg: string }> = {
  Kharif:   { color: "#16a34a", bg: "#f0fdf4" },
  Rabi:     { color: "#2563eb", bg: "#eff6ff" },
  Zaid:     { color: "#ea580c", bg: "#fff7ed" },
  Perennial:{ color: "#9333ea", bg: "#faf5ff" },
};

export default function CalendarPage() {
  const { lang } = useLanguage();
  const [search, setSearch] = useState("");
  const [seasonFilter, setSeasonFilter] = useState<"All" | Season>("All");
  const [showNow, setShowNow] = useState(false);

  const currentMonth = new Date().getMonth(); // 0-indexed

  const filtered = useMemo(() => {
    let data = CALENDAR;
    if (seasonFilter !== "All") data = data.filter(c => c.season === seasonFilter);
    if (showNow) data = data.filter(c => c.sowMonths.includes(currentMonth));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter(c => c.crop.toLowerCase().includes(q) || c.cropHi.includes(search.trim()));
    }
    return data;
  }, [search, seasonFilter, showNow, currentMonth]);

  return (
    <div>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #064e3b, #059669)" }} className="py-8 sm:py-10 px-4">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white mb-1 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-emerald-300" />
            {t(lang, "calTitle")}
          </h1>
          <p className="text-emerald-200 text-xs sm:text-sm">{t(lang, "calSub")}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="bg-emerald-400/20 text-emerald-200 text-xs font-bold px-3 py-1 rounded-full">
              {CALENDAR.length} {lang === "hi" ? "फसलें" : "Crops"}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-3 sm:px-4 py-4 sm:py-6 space-y-4">

        {/* Search + filters */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-5">
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t(lang, "calSearch")}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-emerald-200 bg-white text-emerald-900 font-semibold outline-none focus:border-emerald-500 text-sm placeholder:text-emerald-300"
              style={{ fontSize: "16px" }}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["All", "Kharif", "Rabi", "Zaid", "Perennial"] as const).map(s => {
              const sc = s === "All" ? { color: "#059669", bg: "#ecfdf5" } : SEASON_COLORS[s];
              return (
                <button key={s} type="button" onClick={() => setSeasonFilter(s)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                  style={seasonFilter === s
                    ? { background: sc.color, color: "#fff" }
                    : { background: sc.bg, color: sc.color, border: `1px solid ${sc.color}33` }}>
                  {s === "All" ? t(lang, "calAll") : t(lang, `cal${s}` as never)}
                </button>
              );
            })}
            <button type="button" onClick={() => setShowNow(v => !v)}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1"
              style={showNow
                ? { background: "#f59e0b", color: "#fff" }
                : { background: "#fffbeb", color: "#f59e0b", border: "1px solid #fde68a" }}>
              <Star size={10} /> {t(lang, "calNow")}
            </button>
          </div>
        </div>

        {showNow && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-700 font-medium">
            <Star size={14} className="text-amber-500" /> {t(lang, "calHighlight")}
          </div>
        )}

        <p className="text-xs font-semibold text-gray-400">{filtered.length} {lang === "hi" ? "परिणाम" : "results"}</p>

        {/* Calendar cards */}
        <div className="space-y-3">
          {filtered.map((entry, i) => {
            const sc = SEASON_COLORS[entry.season];
            const isSowNow = entry.sowMonths.includes(currentMonth);
            const isHarvestNow = entry.harvestMonths.includes(currentMonth);
            return (
              <div key={`${entry.crop}-${entry.season}-${i}`}
                className="bg-white rounded-2xl border shadow-sm overflow-hidden card-animate hover:shadow-md transition-shadow"
                style={{ borderColor: isSowNow ? sc.color + "66" : "#e5e7eb", animationDelay: `${i * 0.03}s` }}>
                <div className="px-4 py-3 flex items-start gap-3">
                  <div className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl border"
                    style={{ background: sc.bg, borderColor: sc.color + "33" }}>
                    {entry.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-sm">{lang === "hi" ? entry.cropHi : entry.crop}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: sc.bg, color: sc.color }}>
                        {t(lang, `cal${entry.season}` as never)}
                      </span>
                      {isSowNow && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                          <Sprout size={8} className="inline mr-0.5" /> {lang === "hi" ? "अभी बोएँ!" : "Sow Now!"}
                        </span>
                      )}
                      {isHarvestNow && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-50 text-green-600 border border-green-200">
                          <Scissors size={8} className="inline mr-0.5" /> {lang === "hi" ? "अभी काटें!" : "Harvest Now!"}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1">⏱ {lang === "hi" ? entry.durationHi : entry.duration}</div>
                  </div>
                </div>

                {/* Month timeline bar */}
                <div className="px-4 pb-3">
                  <div className="grid grid-cols-12 gap-0.5 mb-2">
                    {Array.from({ length: 12 }, (_, m) => {
                      const isSow = entry.sowMonths.includes(m);
                      const isHarvest = entry.harvestMonths.includes(m);
                      const isCurrent = m === currentMonth;
                      let bg = "#f3f4f6";
                      let textColor = "#9ca3af";
                      if (isSow) { bg = sc.color; textColor = "#fff"; }
                      else if (isHarvest) { bg = "#f59e0b"; textColor = "#fff"; }
                      return (
                        <div key={m} className="text-center rounded-md py-1 relative"
                          style={{ background: bg, color: textColor, outline: isCurrent ? "2px solid #000" : undefined, outlineOffset: "-1px" }}>
                          <span className="text-[7px] sm:text-[8px] font-bold">
                            {t(lang, MONTH_KEYS[m] as never)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-3 text-[9px] text-gray-400">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: sc.color }} /> {t(lang, "calSowingPeriod")}</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> {t(lang, "calHarvestPeriod")}</span>
                  </div>
                  <p className="mt-2 text-[11px] text-gray-500 leading-relaxed">💡 {lang === "hi" ? entry.tipHi : entry.tip}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
          <Info size={14} className="mt-0.5 shrink-0 text-emerald-400" />
          {t(lang, "calDisclaimer")}
        </div>
      </div>
    </div>
  );
}
