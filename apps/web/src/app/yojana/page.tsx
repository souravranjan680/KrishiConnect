"use client";

import { useMemo, useState } from "react";
import {
  Landmark, Search, ExternalLink, ChevronDown, ChevronUp,
  Shield, CreditCard, Tractor, Droplets, Gift, Info, Filter, BadgeCheck,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";

/* ── Scheme type ── */
type SchemeCategory = "Subsidy" | "Insurance" | "Credit" | "Equipment" | "Irrigation" | "Other";
type Scheme = {
  name: string;
  nameHi: string;
  category: SchemeCategory;
  emoji: string;
  benefit: string;
  benefitHi: string;
  eligibility: string;
  eligibilityHi: string;
  howApply: string;
  howApplyHi: string;
  amount: string;
  amountHi: string;
  url: string;
  ministry: string;
  ministryHi: string;
};

const CATEGORY_META: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  All:        { icon: <Filter size={12} />,      color: "#16a34a", bg: "#f0fdf4" },
  Subsidy:    { icon: <Gift size={12} />,         color: "#9333ea", bg: "#faf5ff" },
  Insurance:  { icon: <Shield size={12} />,       color: "#dc2626", bg: "#fef2f2" },
  Credit:     { icon: <CreditCard size={12} />,   color: "#2563eb", bg: "#eff6ff" },
  Equipment:  { icon: <Tractor size={12} />,      color: "#ea580c", bg: "#fff7ed" },
  Irrigation: { icon: <Droplets size={12} />,     color: "#0891b2", bg: "#ecfeff" },
  Other:      { icon: <Landmark size={12} />,     color: "#65a30d", bg: "#f7fee7" },
};

/* ── 18 real government schemes ── */
const SCHEMES: Scheme[] = [
  {
    name: "PM-KISAN Samman Nidhi",
    nameHi: "पीएम-किसान सम्मान निधि",
    category: "Subsidy",
    emoji: "🏛️",
    benefit: "Direct income support of ₹6,000 per year in 3 installments of ₹2,000 each, transferred directly to farmer's bank account.",
    benefitHi: "₹6,000 प्रति वर्ष सीधे बैंक खाते में — ₹2,000 की 3 किस्तों में।",
    eligibility: "All landholding farmer families with cultivable land. Aadhaar and bank account required.",
    eligibilityHi: "खेती योग्य ज़मीन वाले सभी किसान परिवार। आधार और बैंक खाता ज़रूरी।",
    howApply: "Register at pmkisan.gov.in or visit nearest CSC/post office with Aadhaar, bank passbook & land records.",
    howApplyHi: "pmkisan.gov.in पर रजिस्टर करें या नज़दीकी CSC/पोस्ट ऑफिस जाएँ। आधार, बैंक पासबुक और ज़मीन के कागज़ात लें।",
    amount: "₹6,000/year",
    amountHi: "₹6,000/वर्ष",
    url: "https://pmkisan.gov.in",
    ministry: "Ministry of Agriculture",
    ministryHi: "कृषि मंत्रालय",
  },
  {
    name: "PM Fasal Bima Yojana (PMFBY)",
    nameHi: "पीएम फसल बीमा योजना",
    category: "Insurance",
    emoji: "🛡️",
    benefit: "Crop insurance at very low premium — 2% for Kharif, 1.5% for Rabi, 5% for commercial/horticultural crops. Full claim paid by govt.",
    benefitHi: "बहुत कम प्रीमियम पर फसल बीमा — खरीफ 2%, रबी 1.5%, बागवानी 5%। पूरा क्लेम सरकार देती है।",
    eligibility: "All farmers growing notified crops in notified areas. Both loanee and non-loanee farmers eligible.",
    eligibilityHi: "अधिसूचित क्षेत्र में अधिसूचित फसल उगाने वाले सभी किसान। लोनी और गैर-लोनी दोनों।",
    howApply: "Apply via bank, CSC, or pmfby.gov.in before sowing season deadline. Need land records, Aadhaar, bank details.",
    howApplyHi: "बैंक, CSC, या pmfby.gov.in पर बुवाई से पहले आवेदन करें। ज़मीन के कागज़ात, आधार, बैंक विवरण चाहिए।",
    amount: "Premium: 1.5-5%",
    amountHi: "प्रीमियम: 1.5-5%",
    url: "https://pmfby.gov.in",
    ministry: "Ministry of Agriculture",
    ministryHi: "कृषि मंत्रालय",
  },
  {
    name: "Kisan Credit Card (KCC)",
    nameHi: "किसान क्रेडिट कार्ड",
    category: "Credit",
    emoji: "💳",
    benefit: "Easy credit up to ₹3 lakh at 4% interest (with subsidy). No collateral for loans up to ₹1.6 lakh. Covers cultivation, post-harvest & allied activities.",
    benefitHi: "₹3 लाख तक 4% ब्याज पर आसान कर्ज़ (सब्सिडी के साथ)। ₹1.6 लाख तक बिना गारंटी। खेती, कटाई बाद और सहायक गतिविधियों के लिए।",
    eligibility: "Owner cultivators, tenant farmers, sharecroppers, SHGs, JLGs. Farmers, fishermen, animal husbandry farmers.",
    eligibilityHi: "मालिक किसान, बटाईदार, किरायेदार किसान, SHG, JLG। किसान, मछुआरे, पशुपालक।",
    howApply: "Apply at any bank (especially cooperative banks) with land records, ID proof, and passport-size photos.",
    howApplyHi: "किसी भी बैंक में आवेदन करें — ज़मीन के कागज़ात, पहचान पत्र और फोटो लेकर जाएँ।",
    amount: "Up to ₹3 lakh",
    amountHi: "₹3 लाख तक",
    url: "https://www.pmkisan.gov.in/KCC",
    ministry: "Ministry of Finance",
    ministryHi: "वित्त मंत्रालय",
  },
  {
    name: "Soil Health Card Scheme",
    nameHi: "मिट्टी स्वास्थ्य कार्ड योजना",
    category: "Other",
    emoji: "🧪",
    benefit: "Free soil testing and health card with crop-wise fertilizer recommendations. Reduces input costs by using the right amount of fertilizer.",
    benefitHi: "मुफ्त मिट्टी जाँच और हेल्थ कार्ड — फसल-वार खाद सिफारिश। सही मात्रा में खाद डालने से खर्चा कम।",
    eligibility: "All farmers. Soil samples collected from farms by agricultural department.",
    eligibilityHi: "सभी किसान। कृषि विभाग खेत से मिट्टी का नमूना लेता है।",
    howApply: "Contact local agriculture department or Krishi Vigyan Kendra. Free service.",
    howApplyHi: "स्थानीय कृषि विभाग या कृषि विज्ञान केन्द्र (KVK) से संपर्क करें। मुफ्त सेवा।",
    amount: "Free",
    amountHi: "मुफ्त",
    url: "https://soilhealth.dac.gov.in",
    ministry: "Ministry of Agriculture",
    ministryHi: "कृषि मंत्रालय",
  },
  {
    name: "PM Kisan MaanDhan Yojana",
    nameHi: "पीएम किसान मानधन योजना",
    category: "Subsidy",
    emoji: "👴",
    benefit: "Monthly pension of ₹3,000 after age 60. Farmer contributes ₹55-200/month (based on age), govt contributes equal amount.",
    benefitHi: "60 साल बाद ₹3,000 मासिक पेंशन। किसान ₹55-200/माह देता है (उम्र अनुसार), सरकार बराबर देती है।",
    eligibility: "Small & marginal farmers (landholding up to 2 hectares), age 18-40 years.",
    eligibilityHi: "छोटे और सीमांत किसान (2 हेक्टेयर तक ज़मीन), आयु 18-40 वर्ष।",
    howApply: "Register at nearest CSC with Aadhaar, bank details. Monthly contribution auto-debited.",
    howApplyHi: "नज़दीकी CSC में आधार और बैंक विवरण से रजिस्टर करें। मासिक किश्त ऑटो-डेबिट।",
    amount: "₹3,000/month pension",
    amountHi: "₹3,000/माह पेंशन",
    url: "https://maandhan.in",
    ministry: "Ministry of Agriculture",
    ministryHi: "कृषि मंत्रालय",
  },
  {
    name: "Sub-Mission on Agricultural Mechanization (SMAM)",
    nameHi: "कृषि मशीनीकरण उप मिशन",
    category: "Equipment",
    emoji: "🚜",
    benefit: "40-80% subsidy on farm machinery — tractors, tillers, harvesters, sprayers, threshers. Custom Hiring Centres for renting equipment.",
    benefitHi: "कृषि मशीनरी पर 40-80% सब्सिडी — ट्रैक्टर, टिलर, हार्वेस्टर, स्प्रेयर। कस्टम हायरिंग सेंटर से किराये पर भी उपलब्ध।",
    eligibility: "All farmers, priority to SC/ST/women/small-marginal. Different subsidy rates for different categories.",
    eligibilityHi: "सभी किसान, SC/ST/महिला/छोटे किसानों को प्राथमिकता। श्रेणी अनुसार सब्सिडी दर अलग।",
    howApply: "Apply on agrimachinery.nic.in or through district agriculture office. Need Aadhaar, land records, quotation from dealer.",
    howApplyHi: "agrimachinery.nic.in या जिला कृषि कार्यालय से आवेदन करें। आधार, ज़मीन के कागज़ात, डीलर से कोटेशन चाहिए।",
    amount: "40-80% subsidy",
    amountHi: "40-80% सब्सिडी",
    url: "https://agrimachinery.nic.in",
    ministry: "Ministry of Agriculture",
    ministryHi: "कृषि मंत्रालय",
  },
  {
    name: "PM Krishi Sinchai Yojana (PMKSY)",
    nameHi: "पीएम कृषि सिंचाई योजना",
    category: "Irrigation",
    emoji: "💧",
    benefit: "55-75% subsidy on micro-irrigation (drip & sprinkler). 'Har Khet Ko Pani' — expand irrigation coverage & improve water use efficiency.",
    benefitHi: "सूक्ष्म सिंचाई (ड्रिप और स्प्रिंकलर) पर 55-75% सब्सिडी। 'हर खेत को पानी' — सिंचाई बढ़ाना और पानी बचाना।",
    eligibility: "All farmers with own/leased agricultural land. Priority to water-scarce areas. SC/ST/small farmers get higher subsidy.",
    eligibilityHi: "अपनी या लीज़ पर ज़मीन वाले सभी किसान। पानी की कमी वाले क्षेत्रों को प्राथमिकता।",
    howApply: "Apply through state agriculture/horticulture department. Submit land records, Aadhaar, quotation for irrigation system.",
    howApplyHi: "राज्य कृषि/बागवानी विभाग से आवेदन करें। ज़मीन कागज़ात, आधार, सिंचाई सिस्टम का कोटेशन दें।",
    amount: "55-75% subsidy",
    amountHi: "55-75% सब्सिडी",
    url: "https://pmksy.gov.in",
    ministry: "Ministry of Agriculture",
    ministryHi: "कृषि मंत्रालय",
  },
  {
    name: "e-NAM (National Agriculture Market)",
    nameHi: "ई-नाम (राष्ट्रीय कृषि बाज़ार)",
    category: "Other",
    emoji: "🛒",
    benefit: "Online trading platform for agricultural commodities. Farmers can sell produce to buyers across India, get better prices, transparent auction.",
    benefitHi: "कृषि उत्पादों के लिए ऑनलाइन ट्रेडिंग प्लेटफॉर्म। पूरे भारत के खरीदारों को बेचें, बेहतर दाम, पारदर्शी नीलामी।",
    eligibility: "All farmers. Need Aadhaar and bank account. Over 1,000 mandis connected.",
    eligibilityHi: "सभी किसान। आधार और बैंक खाता ज़रूरी। 1,000+ मंडियाँ जुड़ी हैं।",
    howApply: "Register at enam.gov.in or through your local APMC mandi with required documents.",
    howApplyHi: "enam.gov.in या अपनी स्थानीय APMC मंडी में दस्तावेज़ों के साथ रजिस्टर करें।",
    amount: "Free",
    amountHi: "मुफ्त",
    url: "https://enam.gov.in",
    ministry: "Ministry of Agriculture",
    ministryHi: "कृषि मंत्रालय",
  },
  {
    name: "Paramparagat Krishi Vikas Yojana (PKVY)",
    nameHi: "परंपरागत कृषि विकास योजना",
    category: "Subsidy",
    emoji: "🌿",
    benefit: "₹50,000 per hectare over 3 years for organic farming. Covers organic inputs, certification, marketing support.",
    benefitHi: "जैविक खेती के लिए 3 साल में ₹50,000 प्रति हेक्टेयर। जैविक इनपुट, प्रमाणीकरण, विपणन सहायता शामिल।",
    eligibility: "Groups of 50+ farmers forming a cluster of 50 acres. Priority to rain-fed and tribal areas.",
    eligibilityHi: "50+ किसानों का समूह जो 50 एकड़ का क्लस्टर बनाएँ। वर्षा-आधारित और आदिवासी क्षेत्रों को प्राथमिकता।",
    howApply: "Form a farmer group and apply through district agriculture officer or state organic farming mission.",
    howApplyHi: "किसान समूह बनाएँ और जिला कृषि अधिकारी या राज्य जैविक कृषि मिशन से आवेदन करें।",
    amount: "₹50,000/ha (3 yr)",
    amountHi: "₹50,000/हे. (3 वर्ष)",
    url: "https://pgsindia-ncof.gov.in",
    ministry: "Ministry of Agriculture",
    ministryHi: "कृषि मंत्रालय",
  },
  {
    name: "National Horticulture Mission (NHM)",
    nameHi: "राष्ट्रीय बागवानी मिशन",
    category: "Subsidy",
    emoji: "🍎",
    benefit: "Subsidy for fruit orchards, vegetable cultivation, mushroom production, floriculture. Up to 50-75% cost support for planting material, infrastructure.",
    benefitHi: "फल बागान, सब्जी खेती, मशरूम उत्पादन, फूलों की खेती पर सब्सिडी। रोपण सामग्री, अधोसंरचना पर 50-75% तक सहायता।",
    eligibility: "Farmers, farmer groups, cooperatives, entrepreneurs in horticulture sector.",
    eligibilityHi: "बागवानी क्षेत्र के किसान, किसान समूह, सहकारी, उद्यमी।",
    howApply: "Apply through state horticulture department. Project proposals evaluated at district/state level.",
    howApplyHi: "राज्य बागवानी विभाग से आवेदन करें। जिला/राज्य स्तर पर परियोजना प्रस्ताव का मूल्यांकन।",
    amount: "50-75% subsidy",
    amountHi: "50-75% सब्सिडी",
    url: "https://nhm.gov.in",
    ministry: "Ministry of Agriculture",
    ministryHi: "कृषि मंत्रालय",
  },
  {
    name: "Agriculture Infrastructure Fund (AIF)",
    nameHi: "कृषि अवसंरचना कोष",
    category: "Credit",
    emoji: "🏗️",
    benefit: "3% interest subvention on loans up to ₹2 crore for post-harvest infrastructure — cold storage, warehouses, processing units, sorting-grading.",
    benefitHi: "कटाई के बाद के बुनियादी ढाँचे — कोल्ड स्टोरेज, गोदाम, प्रसंस्करण इकाई पर ₹2 करोड़ तक के लोन पर 3% ब्याज छूट।",
    eligibility: "Farmers, FPOs, PACS, SHGs, agri-entrepreneurs, startups, state agencies.",
    eligibilityHi: "किसान, FPO, PACS, SHG, कृषि-उद्यमी, स्टार्टअप, राज्य एजेंसियाँ।",
    howApply: "Apply online at agriinfra.dac.gov.in. Loan from scheduled banks with 3% interest subvention + CGTMSE guarantee.",
    howApplyHi: "agriinfra.dac.gov.in पर ऑनलाइन आवेदन। बैंक लोन पर 3% ब्याज छूट + CGTMSE गारंटी।",
    amount: "3% interest subsidy",
    amountHi: "3% ब्याज सब्सिडी",
    url: "https://agriinfra.dac.gov.in",
    ministry: "Ministry of Agriculture",
    ministryHi: "कृषि मंत्रालय",
  },
  {
    name: "Pradhan Mantri Kisan Urja Suraksha Utthan Mahabhiyan (PM-KUSUM)",
    nameHi: "पीएम-कुसुम योजना",
    category: "Equipment",
    emoji: "☀️",
    benefit: "60-90% subsidy on solar pumps (up to 7.5 HP). Farmers can also install solar panels on barren land and sell power to DISCOM.",
    benefitHi: "सोलर पंप (7.5 HP तक) पर 60-90% सब्सिडी। बंजर ज़मीन पर सोलर पैनल लगाकर DISCOM को बिजली बेचें।",
    eligibility: "All farmers with irrigation needs. Priority to rain-dependent and water-scarce areas.",
    eligibilityHi: "सिंचाई ज़रूरत वाले सभी किसान। वर्षा-आधारित और पानी की कमी वाले क्षेत्रों को प्राथमिकता।",
    howApply: "Apply through state DISCOM or mnre.gov.in. Need Aadhaar, land records, electricity connection details.",
    howApplyHi: "राज्य DISCOM या mnre.gov.in से आवेदन करें। आधार, ज़मीन कागज़ात, बिजली कनेक्शन विवरण चाहिए।",
    amount: "60-90% subsidy",
    amountHi: "60-90% सब्सिडी",
    url: "https://pmkusum.mnre.gov.in",
    ministry: "Ministry of New & Renewable Energy",
    ministryHi: "नवीन एवं नवीकरणीय ऊर्जा मंत्रालय",
  },
  {
    name: "National Mission on Oilseeds & Oil Palm (NMOOP)",
    nameHi: "तिलहन और ऑयल पाम राष्ट्रीय मिशन",
    category: "Subsidy",
    emoji: "🌻",
    benefit: "Subsidy on certified oilseed varieties, demonstrations, micro-irrigation for oilseed crops. Oil Palm planting material support.",
    benefitHi: "प्रमाणित तिलहन किस्मों, प्रदर्शन, तिलहन फसलों के लिए सूक्ष्म सिंचाई पर सब्सिडी। ऑयल पाम रोपण सामग्री सहायता।",
    eligibility: "Farmers growing oilseed crops or willing to cultivate oil palm.",
    eligibilityHi: "तिलहन फसलें उगाने वाले या ऑयल पाम की खेती करने इच्छुक किसान।",
    howApply: "Contact district agriculture officer or state oilseed federation.",
    howApplyHi: "जिला कृषि अधिकारी या राज्य तिलहन संघ से संपर्क करें।",
    amount: "Varies by component",
    amountHi: "घटक अनुसार भिन्न",
    url: "https://nmoop.gov.in",
    ministry: "Ministry of Agriculture",
    ministryHi: "कृषि मंत्रालय",
  },
  {
    name: "Rashtriya Krishi Vikas Yojana (RKVY)",
    nameHi: "राष्ट्रीय कृषि विकास योजना",
    category: "Other",
    emoji: "🌱",
    benefit: "Flexible funding for state agriculture plans — includes support for agri-startups (up to ₹25 lakh), infrastructure, innovation projects.",
    benefitHi: "राज्य कृषि योजनाओं के लिए लचीला फंड — कृषि स्टार्टअप (₹25 लाख तक), अवसंरचना, नवाचार परियोजनाओं का समर्थन।",
    eligibility: "Farmers, FPOs, agri-entrepreneurs, startups. Varies by state-level project.",
    eligibilityHi: "किसान, FPO, कृषि-उद्यमी, स्टार्टअप। राज्य-स्तरीय परियोजना अनुसार भिन्न।",
    howApply: "Apply through state agriculture department or RKVY-RAFTAAR portal for startup component.",
    howApplyHi: "राज्य कृषि विभाग या स्टार्टअप के लिए RKVY-RAFTAAR पोर्टल से आवेदन करें।",
    amount: "Up to ₹25 lakh",
    amountHi: "₹25 लाख तक",
    url: "https://rkvy.nic.in",
    ministry: "Ministry of Agriculture",
    ministryHi: "कृषि मंत्रालय",
  },
  {
    name: "National Food Security Mission (NFSM)",
    nameHi: "राष्ट्रीय खाद्य सुरक्षा मिशन",
    category: "Subsidy",
    emoji: "🌾",
    benefit: "Subsidized seeds, demonstrations, farm mechanization support for wheat, rice, pulses, coarse cereals, nutri-cereals.",
    benefitHi: "गेहूँ, धान, दलहन, मोटे अनाज के लिए सब्सिडी पर बीज, प्रदर्शन, कृषि मशीनीकरण सहायता।",
    eligibility: "Farmers in identified NFSM districts growing target crops.",
    eligibilityHi: "लक्ष्य फसलें उगाने वाले NFSM जिलों के किसान।",
    howApply: "Contact block agriculture officer. Distributed through state agriculture department.",
    howApplyHi: "ब्लॉक कृषि अधिकारी से संपर्क करें। राज्य कृषि विभाग द्वारा वितरित।",
    amount: "Subsidized inputs",
    amountHi: "सब्सिडी पर इनपुट",
    url: "https://nfsm.gov.in",
    ministry: "Ministry of Agriculture",
    ministryHi: "कृषि मंत्रालय",
  },
];

function SchemeCard({ scheme, lang, expanded, toggle }: { scheme: Scheme; lang: "en" | "hi"; expanded: boolean; toggle: () => void }) {
  const catMeta = CATEGORY_META[scheme.category] ?? CATEGORY_META.Other;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden card-animate hover:shadow-md transition-shadow">
      {/* Header */}
      <button type="button" onClick={toggle} className="w-full text-left px-4 py-4 flex items-start gap-3">
        <div className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ background: catMeta.bg }}>
          {scheme.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900 text-sm leading-snug">{lang === "hi" ? scheme.nameHi : scheme.name}</h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold"
              style={{ color: catMeta.color, background: catMeta.bg }}>
              {catMeta.icon} {lang === "hi" ? t(lang, `yojana${scheme.category}` as never) : scheme.category}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200">
              <BadgeCheck size={10} className="inline mr-0.5" /> {lang === "hi" ? scheme.amountHi : scheme.amount}
            </span>
            <span className="text-[10px] text-gray-400 font-medium">{lang === "hi" ? scheme.ministryHi : scheme.ministry}</span>
          </div>
        </div>
        <div className="shrink-0 mt-1" style={{ color: catMeta.color }}>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-50">
          {[
            { label: t(lang, "yojanaBenefit"), value: lang === "hi" ? scheme.benefitHi : scheme.benefit, color: "#16a34a", bg: "#f0fdf4" },
            { label: t(lang, "yojanaEligibility"), value: lang === "hi" ? scheme.eligibilityHi : scheme.eligibility, color: "#2563eb", bg: "#eff6ff" },
            { label: t(lang, "yojanaHowApply"), value: lang === "hi" ? scheme.howApplyHi : scheme.howApply, color: "#9333ea", bg: "#faf5ff" },
          ].map(sec => (
            <div key={sec.label} className="rounded-xl p-3" style={{ background: sec.bg }}>
              <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: sec.color }}>{sec.label}</div>
              <p className="text-xs text-gray-700 leading-relaxed">{sec.value}</p>
            </div>
          ))}
          <a href={scheme.url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
            style={{ background: catMeta.color }}>
            <ExternalLink size={12} /> {t(lang, "yojanaLink")}
          </a>
        </div>
      )}
    </div>
  );
}

export default function YojanaPage() {
  const { lang } = useLanguage();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const filtered = useMemo(() => {
    let data = SCHEMES;
    if (category !== "All") data = data.filter(s => s.category === category);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter(s =>
        s.name.toLowerCase().includes(q) || s.nameHi.includes(search.trim()) ||
        s.benefit.toLowerCase().includes(q) || s.benefitHi.includes(search.trim())
      );
    }
    return data;
  }, [search, category]);

  const CATS: (SchemeCategory | "All")[] = ["All", "Subsidy", "Insurance", "Credit", "Equipment", "Irrigation", "Other"];

  return (
    <div>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #312e81, #7c3aed)" }} className="pt-24 pb-8 sm:pt-32 sm:pb-10 px-4">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white mb-1 flex items-center gap-2">
            <Landmark className="w-6 h-6 text-purple-300" />
            {t(lang, "yojanaTitle")}
          </h1>
          <p className="text-purple-200 text-xs sm:text-sm">{t(lang, "yojanaSub")}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="bg-purple-400/20 text-purple-200 text-xs font-bold px-3 py-1 rounded-full">
              {SCHEMES.length} {lang === "hi" ? "योजनाएँ" : "Schemes"}
            </span>
            <span className="bg-green-400/20 text-green-200 text-xs font-bold px-3 py-1 rounded-full">
              <BadgeCheck size={10} className="inline mr-1" /> {t(lang, "yojanaActive")}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-3 sm:px-4 py-4 sm:py-6 space-y-4">

        {/* Search + filters */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-5">
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t(lang, "yojanaSearch")}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-purple-200 bg-white text-purple-900 font-semibold outline-none focus:border-purple-500 text-sm placeholder:text-purple-300"
              style={{ fontSize: "16px" }}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATS.map(cat => {
              const meta = CATEGORY_META[cat] ?? CATEGORY_META.Other;
              return (
                <button key={cat} type="button" onClick={() => setCategory(cat)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1"
                  style={category === cat
                    ? { background: "#7c3aed", color: "#fff" }
                    : { background: "#faf5ff", color: "#7c3aed", border: "1px solid #e9d5ff" }}>
                  {meta.icon} {cat === "All" ? t(lang, "yojanaAll") : (lang === "hi" ? t(lang, `yojana${cat}` as never) : cat)}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-xs font-semibold text-gray-400">{filtered.length} {lang === "hi" ? "योजनाएँ" : "schemes"}</p>

        {/* Scheme cards */}
        <div className="space-y-3">
          {filtered.map((scheme, i) => (
            <SchemeCard
              key={scheme.name}
              scheme={scheme}
              lang={lang}
              expanded={expandedIdx === i}
              toggle={() => setExpandedIdx(expandedIdx === i ? null : i)}
            />
          ))}
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 px-4 py-3 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-700">
          <Info size={14} className="mt-0.5 shrink-0 text-purple-400" />
          {t(lang, "yojanaDisclaimer")}
        </div>
      </div>
    </div>
  );
}
