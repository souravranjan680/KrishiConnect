"use client";

import { useMemo, useState } from "react";
import {
  Bug, Search, ChevronDown, ChevronUp, Leaf, FlaskConical, Shield,
  Info, Filter, AlertTriangle,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";

/* ── Types ── */
type DiseaseType = "Fungal" | "Bacterial" | "Viral" | "Pest" | "Nutrient";
type Disease = {
  crop: string;
  cropHi: string;
  emoji: string;
  name: string;
  nameHi: string;
  type: DiseaseType;
  symptoms: string;
  symptomsHi: string;
  organic: string;
  organicHi: string;
  chemical: string;
  chemicalHi: string;
  prevention: string;
  preventionHi: string;
};

const TYPE_META: Record<DiseaseType, { color: string; bg: string; icon: React.ReactNode }> = {
  Fungal:   { color: "#9333ea", bg: "#faf5ff", icon: <FlaskConical size={11} /> },
  Bacterial:{ color: "#dc2626", bg: "#fef2f2", icon: <Bug size={11} /> },
  Viral:    { color: "#ea580c", bg: "#fff7ed", icon: <AlertTriangle size={11} /> },
  Pest:     { color: "#65a30d", bg: "#f7fee7", icon: <Bug size={11} /> },
  Nutrient: { color: "#2563eb", bg: "#eff6ff", icon: <Leaf size={11} /> },
};

/* ── Curated disease/pest database for major Indian crops ── */
const DISEASES: Disease[] = [
  // Rice
  { crop:"Rice", cropHi:"धान", emoji:"🌾", name:"Blast", nameHi:"ब्लास्ट (झोंका)", type:"Fungal",
    symptoms:"Diamond-shaped spots on leaves, white center with brown border. Neck blast causes panicle wilting.", symptomsHi:"पत्तियों पर हीरे के आकार के धब्बे, सफ़ेद बीच में भूरी किनारी। गर्दन ब्लास्ट से बाली मुरझाती है।",
    organic:"Neem oil spray, Trichoderma seed treatment.", organicHi:"नीम तेल स्प्रे, ट्राइकोडर्मा से बीजोपचार।",
    chemical:"Tricyclazole 75 WP (0.6g/L) or Isoprothiolane 40 EC (1.5ml/L).", chemicalHi:"ट्राइसाइक्लाज़ोल 75 WP (0.6g/L) या आइसोप्रोथियोलेन 40 EC (1.5ml/L)।",
    prevention:"Use resistant varieties (Pusa Basmati 1718), avoid excess nitrogen, maintain field drainage.", preventionHi:"प्रतिरोधी किस्में (पूसा बासमती 1718) लगाएँ, अधिक नाइट्रोजन से बचें, जल निकासी रखें।" },
  { crop:"Rice", cropHi:"धान", emoji:"🌾", name:"Brown Plant Hopper", nameHi:"भूरा फुदका", type:"Pest",
    symptoms:"Hopper burn — circular patches of dried plants in field. Honeydew on leaves, sooty mold growth.", symptomsHi:"खेत में गोल पैच में सूखे पौधे। पत्तों पर शहद जैसा चिपचिपा पदार्थ, काली फफूंद।",
    organic:"Release Cyrtorhinus (predator), alternate wetting-drying irrigation.", organicHi:"साइर्टोराइनस (शिकारी कीट) छोड़ें, बारी-बारी गीला-सूखा सिंचाई।",
    chemical:"Imidacloprid 17.8 SL (0.5ml/L). Avoid synthetic pyrethroids.", chemicalHi:"इमिडाक्लोप्रिड 17.8 SL (0.5ml/L)। सिंथेटिक पायरेथ्रॉइड से बचें।",
    prevention:"Avoid excess nitrogen, maintain 30cm spacing, use light traps.", preventionHi:"अधिक नाइट्रोजन से बचें, 30cm दूरी रखें, प्रकाश जाल लगाएँ।" },

  // Wheat
  { crop:"Wheat", cropHi:"गेहूँ", emoji:"🌿", name:"Yellow Rust", nameHi:"पीला रतुआ", type:"Fungal",
    symptoms:"Yellow-orange stripe-like pustules parallel to leaf veins. Severe in cool humid weather.", symptomsHi:"पत्ती की नसों के समानांतर पीले-नारंगी धारी-जैसे दाने। ठंडे नम मौसम में गंभीर।",
    organic:"Remove infected plant debris, crop rotation.", organicHi:"संक्रमित पौधों के अवशेष हटाएँ, फसल चक्र अपनाएँ।",
    chemical:"Propiconazole 25 EC (1ml/L) or Tebuconazole 250 EC (1ml/L).", chemicalHi:"प्रोपिकोनाज़ोल 25 EC (1ml/L) या टेब्यूकोनाज़ोल 250 EC (1ml/L)।",
    prevention:"Sow resistant varieties (HD 3226, DBW 187), timely sowing (Nov 1-25).", preventionHi:"प्रतिरोधी किस्में (HD 3226, DBW 187) लगाएँ, समय पर बुवाई (1-25 नवंबर)।" },
  { crop:"Wheat", cropHi:"गेहूँ", emoji:"🌿", name:"Termite", nameHi:"दीमक", type:"Pest",
    symptoms:"Plants dry up in patches, roots eaten. White tunnels in soil around roots.", symptomsHi:"पैच में पौधे सूख जाते हैं, जड़ें खाई हुई। जड़ों के पास मिट्टी में सफ़ेद सुरंगें।",
    organic:"Apply neem cake (5 q/ha) at sowing, adequate irrigation.", organicHi:"बुवाई पर नीम की खली (5 क्विंटल/हे.) डालें, पर्याप्त सिंचाई।",
    chemical:"Chlorpyriphos 20 EC (4L/ha) mixed with irrigation water.", chemicalHi:"क्लोरपायरिफॉस 20 EC (4L/हे.) सिंचाई के पानी में मिलाएँ।",
    prevention:"Deep summer ploughing, remove crop stubble, treat FYM before application.", preventionHi:"गर्मी में गहरी जुताई, फसल अवशेष हटाएँ, गोबर की खाद उपचारित करके डालें।" },

  // Cotton
  { crop:"Cotton", cropHi:"कपास", emoji:"🤍", name:"Bollworm", nameHi:"बॉलवर्म (सुंडी)", type:"Pest",
    symptoms:"Bored holes in bolls, frass (insect excreta) visible. Premature boll dropping.", symptomsHi:"बॉल्स में छेद, कीट मल दिखाई देता है। बॉल्स समय से पहले गिरती हैं।",
    organic:"Trichogramma egg parasitoid release (1.5 lakh/ha), pheromone traps.", organicHi:"ट्राइकोग्रामा अंड परजीवी (1.5 लाख/हे.) छोड़ें, फेरोमोन ट्रैप लगाएँ।",
    chemical:"Spinosad 45 SC (0.3ml/L) or Emamectin Benzoate 5 SG (0.4g/L).", chemicalHi:"स्पिनोसैड 45 SC (0.3ml/L) या इमामेक्टिन बेन्ज़ोएट 5 SG (0.4g/L)।",
    prevention:"Use Bt cotton varieties, destroy crop residues, avoid late sowing.", preventionHi:"Bt कपास किस्में लगाएँ, फसल अवशेष नष्ट करें, देर से बुवाई से बचें।" },
  { crop:"Cotton", cropHi:"कपास", emoji:"🤍", name:"Whitefly", nameHi:"सफ़ेद मक्खी", type:"Pest",
    symptoms:"White tiny flies under leaves, sticky honeydew, sooty mold. Leaf curling and yellowing.", symptomsHi:"पत्तों के नीचे छोटी सफ़ेद मक्खियाँ, चिपचिपा पदार्थ, काली फफूंद। पत्ते मुड़ना और पीला होना।",
    organic:"Yellow sticky traps, neem oil 3% spray.", organicHi:"पीले चिपचिपे ट्रैप, नीम तेल 3% स्प्रे।",
    chemical:"Diafenthiuron 50 WP (1.2g/L).", chemicalHi:"डायफेंथिउरॉन 50 WP (1.2g/L)।",
    prevention:"Clean cultivation, don't grow cotton next to cucurbits, remove weeds.", preventionHi:"साफ़ खेती, कद्दू वर्गीय फसलों के पास कपास न लगाएँ, खरपतवार हटाएँ।" },

  // Tomato
  { crop:"Tomato", cropHi:"टमाटर", emoji:"🍅", name:"Late Blight", nameHi:"अगेती झुलसा", type:"Fungal",
    symptoms:"Water-soaked dark spots on leaves spreading rapidly, white mold underneath. Fruits rot with dark patches.", symptomsHi:"पत्तों पर तेज़ी से फैलते गहरे पानी-भरे धब्बे, नीचे सफ़ेद फफूंद। फलों पर गहरे धब्बे और सड़न।",
    organic:"Bordeaux mixture 1%, Trichoderma viride spray.", organicHi:"बोर्डो मिश्रण 1%, ट्राइकोडर्मा विरिडी स्प्रे।",
    chemical:"Metalaxyl + Mancozeb (Ridomil Gold 2.5g/L).", chemicalHi:"मेटालैक्सिल + मैनकोज़ेब (रिडोमिल गोल्ड 2.5g/L)।",
    prevention:"Use disease-free seedlings, stake plants, avoid overhead irrigation, crop rotation.", preventionHi:"रोग-मुक्त पौध लगाएँ, पौधों को सहारा दें, ऊपर से पानी न दें, फसल चक्र अपनाएँ।" },
  { crop:"Tomato", cropHi:"टमाटर", emoji:"🍅", name:"Fruit Borer", nameHi:"फल छेदक", type:"Pest",
    symptoms:"Circular holes in fruits, caterpillar inside fruit, premature fruit drop.", symptomsHi:"फलों में गोल छेद, अंदर सुंडी, फल समय से पहले गिरना।",
    organic:"Pheromone traps (H. armigera), Bacillus thuringiensis (Bt) spray.", organicHi:"फेरोमोन ट्रैप, बैसिलस थुरिंजिएंसिस (Bt) स्प्रे।",
    chemical:"Indoxacarb 14.5 SC (0.75ml/L).", chemicalHi:"इंडोक्साकार्ब 14.5 SC (0.75ml/L)।",
    prevention:"Install bird perches, remove infested fruits, intercrop with marigold.", preventionHi:"पक्षी बैठने के लिए खूंटे लगाएँ, संक्रमित फल हटाएँ, गेंदे की अंतरफसल।" },

  // Onion
  { crop:"Onion", cropHi:"प्याज", emoji:"🧅", name:"Purple Blotch", nameHi:"बैंगनी धब्बा", type:"Fungal",
    symptoms:"Purple-brown oval spots on leaves with yellow halo. Leaf tips dry and bend downward.", symptomsHi:"पत्तों पर पीले किनारी वाले बैंगनी-भूरे अंडाकार धब्बे। पत्ती का सिरा सूखकर नीचे झुकता है।",
    organic:"Trichoderma soil application, neem cake.", organicHi:"ट्राइकोडर्मा मिट्टी में डालें, नीम की खली।",
    chemical:"Mancozeb 75 WP (2.5g/L) or Chlorothalonil (2g/L).", chemicalHi:"मैनकोज़ेब 75 WP (2.5g/L) या क्लोरोथैलोनिल (2g/L)।",
    prevention:"Crop rotation (3 year), proper spacing, avoid waterlogging.", preventionHi:"फसल चक्र (3 साल), उचित दूरी, जलभराव से बचें।" },
  { crop:"Onion", cropHi:"प्याज", emoji:"🧅", name:"Thrips", nameHi:"थ्रिप्स", type:"Pest",
    symptoms:"Silver streaks on leaves, curling leaf tips, stunted growth. Severe in dry hot weather.", symptomsHi:"पत्तों पर चांदी जैसी धारियाँ, सिरे मुड़ना, बौना विकास। गर्म शुष्क मौसम में गंभीर।",
    organic:"Blue sticky traps, neem seed kernel extract 5%.", organicHi:"नीले चिपचिपे ट्रैप, नीम बीज गिरी का अर्क 5%।",
    chemical:"Fipronil 5 SC (1.5ml/L) or Spinosad 45 SC (0.3ml/L).", chemicalHi:"फिप्रोनिल 5 SC (1.5ml/L) या स्पिनोसैड 45 SC (0.3ml/L)।",
    prevention:"Overhead irrigation during dry spells, mulching, remove weed hosts.", preventionHi:"सूखे में ऊपर से सिंचाई, मल्चिंग, खरपतवार हटाएँ।" },

  // Potato
  { crop:"Potato", cropHi:"आलू", emoji:"🥔", name:"Late Blight", nameHi:"पछेता झुलसा", type:"Fungal",
    symptoms:"Dark water-soaked patches on leaves, white mold on underside. Tubers show brown dry rot.", symptomsHi:"पत्तों पर गहरे पानी-भरे धब्बे, नीचे सफ़ेद फफूंद। कंदों पर भूरी सूखी सड़न।",
    organic:"Bordeaux mixture 1%, remove infected plants.", organicHi:"बोर्डो मिश्रण 1%, संक्रमित पौधे हटाएँ।",
    chemical:"Cymoxanil + Mancozeb (Curzate M8 3g/L).", chemicalHi:"साइमॉक्सैनिल + मैनकोज़ेब (कर्ज़ेट M8 3g/L)।",
    prevention:"Use certified disease-free seed, earthing up, avoid overhead watering.", preventionHi:"प्रमाणित रोग-मुक्त बीज, मिट्टी चढ़ाना, ऊपर से पानी न दें।" },

  // Chickpea
  { crop:"Chickpea", cropHi:"चना", emoji:"🟤", name:"Wilt (Fusarium)", nameHi:"उकठा (फ्यूज़ेरियम)", type:"Fungal",
    symptoms:"Plants wilt suddenly, leaves dry but stay attached. Root cross-section shows black discoloration.", symptomsHi:"पौधे अचानक मुरझाते हैं, पत्ते सूखते हैं पर लगे रहते हैं। जड़ काटने पर काला दिखता है।",
    organic:"Trichoderma viride seed treatment (4g/kg).", organicHi:"ट्राइकोडर्मा विरिडी बीजोपचार (4g/kg)।",
    chemical:"Carbendazim 50 WP seed treatment (2g/kg) + soil drench.", chemicalHi:"कार्बेन्डाज़िम 50 WP बीजोपचार (2g/kg) + मिट्टी में ड्रेंच।",
    prevention:"Use resistant varieties (JG 315, JG 63), 3-year crop rotation, deep summer ploughing.", preventionHi:"प्रतिरोधी किस्में (JG 315, JG 63), 3 साल का फसल चक्र, गहरी गर्मी जुताई।" },
  { crop:"Chickpea", cropHi:"चना", emoji:"🟤", name:"Pod Borer", nameHi:"फली छेदक", type:"Pest",
    symptoms:"Holes in pods, green caterpillars feeding on seeds inside pods.", symptomsHi:"फलियों में छेद, हरी सुंडी अंदर बीज खाती है।",
    organic:"HaNPV (Helicoverpa virus) spray 250 LE/ha, pheromone traps.", organicHi:"HaNPV (हेलिकोवर्पा वायरस) 250 LE/हे., फेरोमोन ट्रैप।",
    chemical:"Indoxacarb 14.5 SC (0.75ml/L).", chemicalHi:"इंडोक्साकार्ब 14.5 SC (0.75ml/L)।",
    prevention:"Early sowing, intercrop with coriander, bird perches.", preventionHi:"जल्दी बुवाई, धनिया के साथ अंतरफसल, पक्षी खूंटे।" },

  // Sugarcane
  { crop:"Sugarcane", cropHi:"गन्ना", emoji:"🍬", name:"Red Rot", nameHi:"लाल सड़न", type:"Fungal",
    symptoms:"Inner cane turns red with white patches. Leaves dry from top, sour smell from cut cane.", symptomsHi:"गन्ने का अंदरूनी भाग सफ़ेद पैच के साथ लाल हो जाता है। ऊपर से पत्ते सूखते हैं, कटे गन्ने से खट्टी गंध।",
    organic:"Hot water treatment of setts (50°C for 2 hours).", organicHi:"सेट्स का गर्म पानी उपचार (50°C पर 2 घंटे)।",
    chemical:"Carbendazim 50 WP sett treatment (0.1%).", chemicalHi:"कार्बेन्डाज़िम 50 WP सेट उपचार (0.1%)।",
    prevention:"Use disease-free setts, resistant varieties (Co 238, CoJ 64), avoid ratooning infected fields.", preventionHi:"रोग-मुक्त सेट, प्रतिरोधी किस्में (Co 238, CoJ 64), संक्रमित खेत से पेड़ी न लें।" },

  // Mustard
  { crop:"Mustard", cropHi:"सरसों", emoji:"🌼", name:"White Rust", nameHi:"सफ़ेद रतुआ", type:"Fungal",
    symptoms:"White blister-like pustules on leaf underside. Deformed flowers and pods.", symptomsHi:"पत्ती के नीचे सफ़ेद फफोले जैसे दाने। फूलों और फलियों में विकृति।",
    organic:"Remove infected plant parts, improve air circulation.", organicHi:"संक्रमित भाग हटाएँ, हवा का आवागम सुधारें।",
    chemical:"Metalaxyl + Mancozeb (Ridomil Gold 2.5g/L).", chemicalHi:"मेटालैक्सिल + मैनकोज़ेब (रिडोमिल गोल्ड 2.5g/L)।",
    prevention:"Use resistant varieties, timely sowing, proper plant spacing.", preventionHi:"प्रतिरोधी किस्में, समय पर बुवाई, उचित दूरी।" },
  { crop:"Mustard", cropHi:"सरसों", emoji:"🌼", name:"Aphid", nameHi:"माहू (चेंपा)", type:"Pest",
    symptoms:"Green-black soft insects clustering on shoots and flower buds. Leaf curling, honeydew secretion.", symptomsHi:"हरे-काले कीट शाखाओं और कलियों पर झुंड में। पत्ते मुड़ना, शहद जैसा चिपचिपा।",
    organic:"Spray neem oil 3%, ladybird beetle release.", organicHi:"नीम तेल 3% स्प्रे, लेडीबर्ड बीटल छोड़ें।",
    chemical:"Imidacloprid 17.8 SL (0.3ml/L).", chemicalHi:"इमिडाक्लोप्रिड 17.8 SL (0.3ml/L)।",
    prevention:"Early sowing (Oct 15-25), yellow sticky traps, avoid excess nitrogen.", preventionHi:"जल्दी बुवाई (15-25 अक्टूबर), पीले चिपचिपे ट्रैप, अधिक नाइट्रोजन से बचें।" },

  // Mango
  { crop:"Mango", cropHi:"आम", emoji:"🥭", name:"Powdery Mildew", nameHi:"चूर्णिल आसिता", type:"Fungal",
    symptoms:"White powder on flowers and young fruits. Flower drop, small deformed fruits.", symptomsHi:"फूलों और छोटे फलों पर सफ़ेद पाउडर। फूल गिरना, छोटे विकृत फल।",
    organic:"Sulphur dust 300 mesh, wettable sulphur 0.2%.", organicHi:"गंधक चूर्ण 300 मेश, घुलनशील गंधक 0.2%।",
    chemical:"Karathane 0.1% or Triadimefon 0.1%.", chemicalHi:"कैराथेन 0.1% या ट्रायडिमेफॉन 0.1%।",
    prevention:"Prune overcrowded branches, fungicide spray at panicle emergence.", preventionHi:"घनी शाखाएँ काटें, बौर आने पर फफूंदनाशक स्प्रे।" },

  // Chilli
  { crop:"Chilli", cropHi:"मिर्च", emoji:"🌶️", name:"Leaf Curl Virus", nameHi:"पत्ती मोड़क विषाणु", type:"Viral",
    symptoms:"Upward leaf curling, thick veins, stunted bushy growth. Spread by whitefly.", symptomsHi:"पत्ते ऊपर की ओर मुड़ना, मोटी नसें, बौना झाड़ीनुमा। सफ़ेद मक्खी से फैलता है।",
    organic:"Neem oil spray for whitefly, uproot infected plants.", organicHi:"सफ़ेद मक्खी के लिए नीम तेल स्प्रे, संक्रमित पौधे उखाड़ें।",
    chemical:"Imidacloprid 17.8 SL (0.3ml/L) spray for vector control.", chemicalHi:"वेक्टर नियंत्रण के लिए इमिडाक्लोप्रिड 17.8 SL (0.3ml/L) स्प्रे।",
    prevention:"Use virus-free seedlings, silver mulch to repel whitefly, crop rotation.", preventionHi:"वायरस-मुक्त पौध, सफ़ेद मक्खी भगाने के लिए सिल्वर मल्च, फसल चक्र।" },

  // Banana
  { crop:"Banana", cropHi:"केला", emoji:"🍌", name:"Panama Wilt", nameHi:"पनामा विल्ट", type:"Fungal",
    symptoms:"Yellowing of older leaves from margin, petiole breaks, brown vascular discoloration in pseudostem.", symptomsHi:"पुरानी पत्तियाँ किनारे से पीली, डंठल टूटना, तने में भूरा संवहनी रंग बदलाव।",
    organic:"Trichoderma viride + Pseudomonas fluorescens soil application.", organicHi:"ट्राइकोडर्मा विरिडी + स्यूडोमोनास फ्लोरेसेंस मिट्टी में डालें।",
    chemical:"Carbendazim 50 WP drench (2g/L) at planting.", chemicalHi:"कार्बेन्डाज़िम 50 WP ड्रेंच (2g/L) रोपाई पर।",
    prevention:"Use tissue culture plants, clean planting material, avoid infected fields for 5 years.", preventionHi:"टिश्यू कल्चर पौधे, साफ़ रोपण सामग्री, संक्रमित खेत 5 साल तक खाली रखें।" },

  // Turmeric
  { crop:"Turmeric", cropHi:"हल्दी", emoji:"🟡", name:"Rhizome Rot", nameHi:"प्रकंद सड़न", type:"Fungal",
    symptoms:"Yellow, wilting leaves from bottom up. Rhizome turns soft brown with foul smell.", symptomsHi:"नीचे से ऊपर पत्ते पीले और मुरझाना। प्रकंद मुलायम भूरा दुर्गंध वाला।",
    organic:"Trichoderma + Pseudomonas rhizome treatment before planting.", organicHi:"रोपण से पहले ट्राइकोडर्मा + स्यूडोमोनास से प्रकंद उपचार।",
    chemical:"Metalaxyl + Mancozeb drench (3g/L).", chemicalHi:"मेटालैक्सिल + मैनकोज़ेब ड्रेंच (3g/L)।",
    prevention:"Good drainage, raised beds, use disease-free seed rhizomes.", preventionHi:"अच्छी जल निकासी, ऊँची क्यारियाँ, रोग-मुक्त बीज प्रकंद।" },
];

const CROP_FILTER_OPTIONS = ["All", ...Array.from(new Set(DISEASES.map(d => d.crop)))];

function DiseaseCard({ d, lang, expanded, toggle }: { d: Disease; lang: "en" | "hi"; expanded: boolean; toggle: () => void }) {
  const tm = TYPE_META[d.type];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden card-animate hover:shadow-md transition-shadow">
      <button type="button" onClick={toggle} className="w-full text-left px-4 py-3 flex items-start gap-3">
        <div className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ background: tm.bg }}>
          {d.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900 text-sm">{lang === "hi" ? d.nameHi : d.name}</h3>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ color: tm.color, background: tm.bg }}>
              {tm.icon} {lang === "hi" ? t(lang, `diseaseType${d.type}` as never) : d.type}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 font-medium mt-0.5">
            {d.emoji} {lang === "hi" ? d.cropHi : d.crop}
          </p>
        </div>
        <div className="shrink-0 mt-1 text-gray-400">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-2.5 border-t border-gray-50">
          {[
            { label: t(lang, "diseaseSymptoms"), value: lang === "hi" ? d.symptomsHi : d.symptoms, color: "#dc2626", bg: "#fef2f2", icon: <AlertTriangle size={12} /> },
            { label: t(lang, "diseasePrevention"), value: lang === "hi" ? d.preventionHi : d.prevention, color: "#2563eb", bg: "#eff6ff", icon: <Shield size={12} /> },
            { label: t(lang, "diseaseOrganic"), value: lang === "hi" ? d.organicHi : d.organic, color: "#16a34a", bg: "#f0fdf4", icon: <Leaf size={12} /> },
            { label: t(lang, "diseaseChemical"), value: lang === "hi" ? d.chemicalHi : d.chemical, color: "#9333ea", bg: "#faf5ff", icon: <FlaskConical size={12} /> },
          ].map(sec => (
            <div key={sec.label} className="rounded-xl p-3" style={{ background: sec.bg }}>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: sec.color }}>
                {sec.icon} {sec.label}
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">{sec.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DiseasesPage() {
  const { lang } = useLanguage();
  const [search, setSearch] = useState("");
  const [cropFilter, setCropFilter] = useState("All");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const filtered = useMemo(() => {
    let data = DISEASES;
    if (cropFilter !== "All") data = data.filter(d => d.crop === cropFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter(d =>
        d.crop.toLowerCase().includes(q) || d.cropHi.includes(search.trim()) ||
        d.name.toLowerCase().includes(q) || d.nameHi.includes(search.trim()) ||
        d.symptoms.toLowerCase().includes(q) || d.symptomsHi.includes(search.trim())
      );
    }
    return data;
  }, [search, cropFilter]);

  return (
    <div>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #7f1d1d, #dc2626)" }} className="pt-24 pb-8 sm:pt-32 sm:pb-10 px-4">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white mb-1 flex items-center gap-2">
            <Bug className="w-6 h-6 text-red-300" />
            {t(lang, "diseaseTitle")}
          </h1>
          <p className="text-red-200 text-xs sm:text-sm">{t(lang, "diseaseSub")}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="bg-red-400/20 text-red-200 text-xs font-bold px-3 py-1 rounded-full">
              {DISEASES.length} {lang === "hi" ? "रोग/कीट" : "Diseases/Pests"}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-3 sm:px-4 py-4 sm:py-6 space-y-4">

        {/* Search + crop filter */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-5">
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t(lang, "diseaseSearch")}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-red-200 bg-white text-red-900 font-semibold outline-none focus:border-red-500 text-sm placeholder:text-red-300"
              style={{ fontSize: "16px" }}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CROP_FILTER_OPTIONS.map(c => (
              <button key={c} type="button" onClick={() => setCropFilter(c)}
                className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={cropFilter === c
                  ? { background: "#dc2626", color: "#fff" }
                  : { background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                {c === "All" ? t(lang, "diseaseAll") : (lang === "hi" ? DISEASES.find(d => d.crop === c)?.cropHi ?? c : c)}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs font-semibold text-gray-400">{filtered.length} {lang === "hi" ? "परिणाम" : "results"}</p>

        {filtered.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center text-sm text-gray-400">
            {t(lang, "diseaseNone")}
          </div>
        )}

        {/* Disease cards */}
        <div className="space-y-3">
          {filtered.map((d, i) => (
            <DiseaseCard
              key={`${d.crop}-${d.name}`}
              d={d}
              lang={lang}
              expanded={expandedIdx === i}
              toggle={() => setExpandedIdx(expandedIdx === i ? null : i)}
            />
          ))}
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700">
          <Info size={14} className="mt-0.5 shrink-0 text-red-400" />
          {t(lang, "diseaseDisclaimer")}
        </div>
      </div>
    </div>
  );
}
