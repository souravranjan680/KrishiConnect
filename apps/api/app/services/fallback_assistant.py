from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any

import asyncio
import re

from app.schemas import SoilInfo, WeatherInfo
from app.services.recommendation_service import get_recommendations
from app.services.soil_service import get_soil_by_coords
from app.services.weather_service import get_weather_by_coords


@dataclass(frozen=True)
class Intent:
    name: str
    confidence: float


def _norm(s: str) -> str:
    return (s or "").strip()


def _lower(s: str) -> str:
    return _norm(s).lower()


# ── Language auto-detection ──────────────────────────────────────────────

def _detect_lang(message: str, lang_hint: str | None = None) -> str:
    """Detect language from the message itself. Returns 'hi' or 'en'."""
    # Check for Devanagari characters (Hindi script)
    devanagari_count = sum(1 for c in message if '\u0900' <= c <= '\u097F')
    if devanagari_count > 0:
        return "hi"

    # Hinglish detection — common Hindi words in Latin script
    hinglish_words = {
        "kya", "hai", "hain", "kaise", "kaisa", "mera", "meri", "mere",
        "karo", "karna", "batao", "bataiye", "gaon", "fasal", "kheti",
        "namaste", "dhanyawad", "ji", "haan", "nahi", "acha", "accha",
        "aur", "yeh", "woh", "kab", "kahan", "kitna", "kitni",
        "bol", "bolo", "suno", "dekho", "chahiye", "lagao", "ugao",
        "pani", "khad", "mitti", "mausam", "bij", "beej", "ugayen",
        "mujhe", "humko", "hume", "apna", "apni", "apne", "kaun",
        "konsi", "bhai", "didi", "sahab", "gehu", "gehun", "dhan",
        "sarson", "chana", "makka", "tamatar", "aloo", "pyaz", "mirch",
        "kapas", "ganna", "soybean", "moong", "urad", "tuar", "arhar",
        "krishi", "kisan", "zameen", "bojh", "upaj", "bijayi", "katai",
        "rog", "keeda", "keet", "dawai", "spray", "dawa", "ilaj",
        "barish", "garmi", "sardi", "thand", "dhoop", "sukhha", "baadh",
        "yojana", "sarkari", "labh", "avedan", "daam", "bhav", "bazaar",
        "bhai", "sahab", "bhaiya", "anna", "dada", "tau",
        "hona", "hona", "karenge", "denge", "lenge", "bolenge",
        "samjhao", "btao", "btaiye", "smjhao", "kaise", "kyu", "kyun",
    }
    words = set(_lower(message).split())
    if len(words & hinglish_words) >= 1:
        return "hi"

    # Fall back to the UI hint
    if lang_hint and lang_hint.lower().startswith("hi"):
        return "hi"

    return "en"


# ── Intent detection ─────────────────────────────────────────────────────

def _detect_intent(message: str) -> Intent:
    m = _lower(message)

    # Greetings (must be checked FIRST)
    greetings = [
        "hello", "hi", "hey", "namaste", "namaskar", "good morning", "good evening",
        "bye", "goodbye", "alvida", "dhanyawad", "thanks", "thank you", "shukriya",
        "kaise ho", "kya hal", "howdy", "sup", "what's up",
        "नमस्ते", "नमस्कार", "धन्यवाद", "शुक्रिया", "अलविदा",
    ]
    if any(g in m for g in greetings):
        return Intent("greeting", 0.9)

    if any(k in m for k in ["recommend", "suggest", "crop", "fasal", "फसल", "सलाह",
                             "उगाऊं", "बोऊं", "ugau", "bou", "ugayen", "konsi", "kaun si",
                             "कौन सी", "what should i grow", "best crop",
                             "boye", "lagaye", "lagau", "उगाएं", "लगाऊं", "लगाएं",
                             "बोना", "उगाना", "harvest", "season", "rabi", "kharif",
                             "रबी", "खरीफ", "ज़ायद", "zaid"]):
        return Intent("recommend", 0.8)
    if any(k in m for k in ["disease", "pest", "कीट", "रोग", "blight", "spot", "mosaic",
                             "pila", "पीला", "yellow", "leaf", "patta", "पत्ता", "kida", "कीड़ा",
                             "rog", "bimari", "बीमारी", "fungus", "곰팡", "sookh", "सूख",
                             "murjha", "मुरझा", "gal", "गल", "सड़", "sad", "jhulsa", "झुलसा",
                             "dhabb", "धब्ब", "insect", "bug", "keeda", "कीड़", "ilaj", "इलाज",
                             "dawai", "दवाई", "spray", "medicine", "upchar", "उपचार"]):
        return Intent("disease", 0.7)
    if any(k in m for k in ["fertil", "urea", "dap", "npk", "खाद", "उर्वरक", "khad",
                             "compost", "gober", "गोबर", "vermi", "जीवामृत", "jeevamrit",
                             "potash", "zinc", "boron", "manure"]):
        return Intent("fertilizer", 0.7)
    if any(k in m for k in ["water", "irrig", "सिंच", "पानी", "drip", "pani",
                             "sprinkler", "nher", "नहर", "tubewell", "boring", "बोरिंग"]):
        return Intent("irrigation", 0.6)
    if any(k in m for k in ["weather", "rain", "बारिश", "मौसम", "temperature", "temp", "mausam", "barish",
                             "garmi", "गर्मी", "sardi", "सर्दी", "thand", "ठंड", "dhoop", "धूप",
                             "aandhi", "आंधी", "toofan", "तूफ़ान", "ola", "ओला", "hail"]):
        return Intent("weather", 0.6)
    if any(k in m for k in ["mandi", "price", "भाव", "रेट", "बाजार", "rate", "daam",
                             "bikri", "बिक्री", "sell", "bechna", "बेचना", "market"]):
        return Intent("price", 0.6)
    if any(k in m for k in ["yojana", "scheme", "subsidy", "योजना", "सब्सिडी", "pm-kisan",
                             "pm kisan", "fasal bima", "फसल बीमा", "pmfby", "kcc",
                             "किसान क्रेडिट", "kisan credit", "soil health", "enam",
                             "sarkari", "सरकारी", "government", "labh", "लाभ"]):
        return Intent("scheme", 0.6)

    return Intent("general", 0.3)


def _guess_village_from_message(message: str) -> str | None:
    """Best-effort location extraction from free-form text.

    This is intentionally conservative to avoid false positives.
    Examples it can catch:
      - "recommend crop in Dehradun"
      - "mere gaon Doiwala me kya ugau"
      - "गांव रायपुर में कौन सी फसल"
    """
    m = _norm(message)
    if not m:
        return None

    # English: "in <place>"
    match = re.search(r"\b(?:in|at|near)\s+([A-Za-z][A-Za-z .\-]{1,40})", m, flags=re.IGNORECASE)
    if match:
        place = match.group(1).strip(" .,-\n\t")
        # Avoid obviously non-place fragments.
        if place and len(place) >= 2 and place.lower() not in {"india", "up", "mp", "cg"}:
            return place

    # Hinglish: "gaon <place>" or "village <place>"
    match = re.search(r"\b(?:gaon|gांव|गाँव|village)\s+([^,.;\n]{2,40})", m, flags=re.IGNORECASE)
    if match:
        place = match.group(1).strip(" .,-\n\t")
        if place and len(place) >= 2:
            return place

    # Hindi: "<place> में"
    match = re.search(r"\b([^,.;\n]{2,40})\s+(?:में|मे)\b", m)
    if match:
        place = match.group(1).strip(" .,-\n\t")
        if place and len(place) >= 2:
            return place

    return None


def _lang_is_hi(lang_hint: str | None, message: str = "") -> bool:
    return _detect_lang(message, lang_hint) == "hi"


def _format_reco_text(result: Any, lang_hint: str | None, message: str = "") -> str:
    """Format RecommendResponse into a natural voice-friendly reply."""

    is_hi = _lang_is_hi(lang_hint, message)

    if isinstance(result, dict):
        recommendations = result.get("recommendations") or []
        location = result.get("location") or {}
        soil = result.get("soil")
        weather = result.get("weather")
    else:
        recommendations = getattr(result, "recommendations", [])
        location = getattr(result, "location", None) or {}
        soil = getattr(result, "soil", None)
        weather = getattr(result, "weather", None)

    top = recommendations[0] if recommendations else None
    crop = None
    confidence = None
    advice = None
    if isinstance(top, dict):
        crop = top.get("crop")
        confidence = top.get("confidence")
        advice = top.get("advice")
    elif top is not None:
        crop = getattr(top, "crop", None)
        confidence = getattr(top, "confidence", None)
        advice = getattr(top, "advice", None)

    crop_txt = str(crop) if crop else None
    conf_txt = None
    if isinstance(confidence, (int, float)):
        conf_txt = f"{confidence:.0%}"

    location_display = None
    if isinstance(location, dict):
        location_display = location.get("display")

    # Never speak/show raw coordinates to users in chat responses.
    if isinstance(location_display, str):
        coord_like = bool(re.match(r"^\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*$", location_display))
        if coord_like:
            location_display = None

    def _w(weather_obj: Any) -> tuple[float | None, float | None, float | None]:
        if not weather_obj:
            return None, None, None
        if isinstance(weather_obj, dict):
            t = weather_obj.get("temperature")
            h = weather_obj.get("humidity")
            r = weather_obj.get("rainfall")
            return (
                float(t) if isinstance(t, (int, float)) else None,
                float(h) if isinstance(h, (int, float)) else None,
                float(r) if isinstance(r, (int, float)) else None,
            )
        t = getattr(weather_obj, "temperature", None)
        h = getattr(weather_obj, "humidity", None)
        r = getattr(weather_obj, "rainfall", None)
        return (
            float(t) if isinstance(t, (int, float)) else None,
            float(h) if isinstance(h, (int, float)) else None,
            float(r) if isinstance(r, (int, float)) else None,
        )

    if is_hi:
        parts: list[str] = []
        if crop_txt:
            loc = location_display or 'आपके GPS'
            parts.append(f"आपकी लोकेशन ({loc}) के हिसाब से सबसे अच्छी फसल {crop_txt} है।")
        else:
            parts.append("मैं आपकी लोकेशन के हिसाब से फसल की सलाह निकाल रहा हूँ।")
        if conf_txt:
            parts.append(f"AI की {conf_txt} भरोसेमंदता है।")
        t, h, r = _w(weather)
        if t is not None and h is not None:
            parts.append(f"अभी तापमान {t}°C है, नमी {h}% है।")
        if r is not None:
            parts.append(f"30 दिन की बारिश: {r} mm।")
        if advice and isinstance(advice, dict):
            water = advice.get("water")
            fert = advice.get("fertilizer")
            if isinstance(water, str) and water:
                parts.append(f"पानी: {water}")
            if isinstance(fert, str) and fert:
                parts.append(f"खाद: {fert}")
        parts.append("बेहतर जानकारी के लिए अपने नज़दीकी KVK या कृषि विभाग से भी संपर्क करें।")
        return " ".join(parts)

    parts2: list[str] = []
    if crop_txt:
        loc = location_display or 'your GPS'
        parts2.append(f"Based on your location ({loc}), the best crop for you is {crop_txt}.")
    else:
        parts2.append("I can generate a crop recommendation from your location.")
    if conf_txt:
        parts2.append(f"AI confidence: {conf_txt}.")
    t, h, r = _w(weather)
    if t is not None and h is not None:
        parts2.append(f"Current temperature is {t}°C with {h}% humidity.")
    if r is not None:
        parts2.append(f"30-day rainfall: {r} mm.")
    if advice and isinstance(advice, dict):
        water = advice.get("water")
        fert = advice.get("fertilizer")
        if isinstance(water, str) and water:
            parts2.append(f"Water: {water}")
        if isinstance(fert, str) and fert:
            parts2.append(f"Fertilizer: {fert}")
    parts2.append("For best results, also consult your local KVK or agriculture officer.")
    return " ".join(parts2)


async def _run_real_recommendation(
    *,
    village: str | None,
    lat: float | None,
    lon: float | None,
) -> Any:
    has_village = bool(village and village.strip())
    has_gps = lat is not None and lon is not None

    if not has_village and not has_gps:
        raise ValueError("Missing location")

    if not has_gps:
        from app.services.geocoding import geocode

        lat, lon = await geocode(village.strip())  # type: ignore[union-attr]
        location_display = village.strip()  # type: ignore[union-attr]
    else:
        from app.services.geocoding import reverse_geocode

        try:
            location_display = await reverse_geocode(float(lat), float(lon))  # type: ignore[arg-type]
        except Exception:
            location_display = f"{lat:.4f}, {lon:.4f}"  # type: ignore[arg-type]

    soil, weather = await asyncio.gather(
        get_soil_by_coords(lat, lon),  # type: ignore[arg-type]
        get_weather_by_coords(lat, lon),  # type: ignore[arg-type]
    )

    result = get_recommendations(soil=soil, weather=weather)

    # Attach minimal context similarly to /recommend.
    result.location = {
        "lat": round(float(lat), 5),
        "lon": round(float(lon), 5),
        "display": location_display,
    }
    result.weather = WeatherInfo(
        temperature=round(weather.temperature, 1),
        humidity=round(weather.humidity, 1),
        rainfall=round(weather.rainfall, 1),
    )
    result.soil = SoilInfo(
        N=round(soil.N, 1),
        P=round(soil.P, 1),
        K=round(soil.K, 1),
        ph=round(soil.ph, 2),
    )
    return result


async def fallback_reply(
    message: str,
    lang_hint: str | None = None,
    village: str | None = None,
    lat: float | None = None,
    lon: float | None = None,
) -> str:
    """No-key assistant — conversational, natural language replies.

    If location is available and the user asks for a recommendation, it will call the
    real internal pipeline (soil + weather + ML) via recommendation_service.
    Otherwise it returns a natural, voice-friendly reply.
    """

    intent = _detect_intent(message)
    village = _norm(village) or None

    if not village and intent.name in {"recommend", "weather"}:
        village = _guess_village_from_message(message)

    # If we have GPS and user intent is recommendation, run the real pipeline.
    if intent.name in {"recommend", "weather"} and (village or (lat is not None and lon is not None)):
        try:
            result = await _run_real_recommendation(village=village, lat=lat, lon=lon)
            return _format_reco_text(result, lang_hint, message)
        except Exception:
            pass

    is_hi = _lang_is_hi(lang_hint, message)

    # ── Greetings ──────────────────────────────────────────────────────
    if intent.name == "greeting":
        if is_hi:
            return (
                "नमस्ते भाई! कैसे हो? मैं Kishan Sathi AI हूँ — आपका खेती का साथी। "
                "बताओ क्या चल रहा है खेत में? फसल, मौसम, कीड़ा-रोग, खाद, "
                "सरकारी योजना — कुछ भी पूछो, मज़े से बताऊंगा।"
            )
        return (
            "Hello! I'm Kishan Sathi AI — your friendly farming assistant. "
            "What's going on in your fields? Ask me about crops, weather, pests, "
            "fertilizers, or government schemes — happy to help."
        )

    if intent.name == "recommend":
        if is_hi:
            return (
                "भाई, सही फसल बताने के लिए मुझे आपकी लोकेशन चाहिए — "
                "ताकि मैं वहाँ की मिट्टी और मौसम देख सकूँ।\n\n"
                "GPS allow कर दो या बस अपने गाँव/तहसील का नाम बोल दो। "
                "मैं soil + weather check करके best फसल बताऊंगा — "
                "confidence percentage के साथ।"
            )
        return (
            "To recommend the best crop, I need your location — "
            "so I can check your soil and weather conditions.\n\n"
            "Please allow GPS or just tell me your village/tehsil name. "
            "I'll analyze soil nutrients + weather and suggest the most profitable crop."
        )

    if intent.name == "disease":
        if is_hi:
            return (
                "रोग/कीट की समस्या है? कोई बात नहीं, मिलकर सुलझाएंगे।\n\n"
                "बस बताओ:\n"
                "• कौन सी फसल है? (गेहूँ, धान, टमाटर...)\n"
                "• क्या दिख रहा है? (पत्ते पीले, धब्बे, कीड़ा, सूखना...)\n"
                "• कब से है?\n\n"
                "मैं तुरंत उपाय बता दूँगा — जैविक और रासायनिक दोनों।"
            )
        return (
            "Got a pest or disease problem? Let's sort it out.\n\n"
            "Just tell me:\n"
            "• Which crop? (wheat, rice, tomato...)\n"
            "• What do you see? (yellow leaves, spots, insects, wilting...)\n"
            "• How long has it been?\n\n"
            "I'll suggest both organic and chemical remedies."
        )

    if intent.name == "fertilizer":
        if is_hi:
            return (
                "खाद का सही plan फसल और उसकी उम्र पर निर्भर करता है। "
                "बताओ कौन सी फसल है और अभी कौन सी stage में है:\n\n"
                "• बुआई के समय → DAP + पोटाश base dose\n"
                "• 20-25 दिन → पहली यूरिया top dressing\n"
                "• फूल/दाना → दूसरी यूरिया + micro-nutrients\n\n"
                "फसल का नाम बताओ, मैं exact schedule दे दूँगा।"
            )
        return (
            "Fertilizer plan depends on your crop and growth stage:\n\n"
            "• At sowing → DAP + Potash as base\n"
            "• 20-25 days → First Urea top dressing\n"
            "• Flowering → Second Urea + micro-nutrients\n\n"
            "Tell me your crop name and I'll give you the exact NPK schedule."
        )

    if intent.name == "irrigation":
        if is_hi:
            return (
                "पानी का management बहुत ज़रूरी है भाई।\n\n"
                "बताओ:\n"
                "• कौन सी फसल है?\n"
                "• मिट्टी कैसी है — बलुई, दोमट, या चिकनी?\n"
                "• आखिरी बार कब पानी दिया?\n\n"
                "मैं बताऊंगा कितने दिन के gap पर पानी देना है "
                "और drip/sprinkler से पानी कैसे बचाएं।"
            )
        return (
            "Water management is crucial.\n\n"
            "Tell me:\n"
            "• Which crop?\n"
            "• Soil type — sandy, loam, or clay?\n"
            "• When did you last irrigate?\n\n"
            "I'll guide you on irrigation frequency and how to save water with drip/sprinkler."
        )

    if intent.name == "weather":
        if is_hi:
            return (
                "मौसम की जानकारी के लिए मुझे आपकी लोकेशन चाहिए।\n\n"
                "GPS allow कर दो या गाँव का नाम बताओ — "
                "मैं real-time तापमान, नमी, और 30 दिन की बारिश बता दूँगा। "
                "साथ में बताऊंगा कि इस मौसम में कौन सा काम करना चाहिए।"
            )
        return (
            "I need your location for weather updates.\n\n"
            "Allow GPS or tell me your village name — "
            "I'll get real-time temperature, humidity, and 30-day rainfall. "
            "Plus, I'll advise what farming activities suit this weather."
        )

    if intent.name == "scheme":
        if is_hi:
            return (
                "सरकारी योजनाओं में बहुत फायदा है भाई।\n\n"
                "कुछ प्रमुख योजनाएं:\n"
                "• PM-KISAN — ₹6,000/साल सीधे बैंक में (3 किस्तें)\n"
                "• PMFBY — फसल बीमा, प्राकृतिक आपदा में मुआवज़ा\n"
                "• Soil Health Card — मुफ़्त मिट्टी जांच + खाद सलाह\n"
                "• eNAM — ऑनलाइन मंडी, अच्छे दाम\n"
                "• KCC — किसान क्रेडिट कार्ड, सस्ता लोन\n\n"
                "किस योजना के बारे में detail चाहिए? बताओ।"
            )
        return (
            "Government schemes can really benefit you.\n\n"
            "Key schemes:\n"
            "• PM-KISAN — ₹6,000/year direct to bank (3 installments)\n"
            "• PMFBY — Crop insurance for natural disasters\n"
            "• Soil Health Card — Free soil testing + fertilizer advice\n"
            "• eNAM — Online mandi, better prices\n"
            "• KCC — Kisan Credit Card, low-interest loans\n\n"
            "Which scheme do you want details about?"
        )

    if intent.name == "price":
        if is_hi:
            return (
                "मंडी भाव जानने के लिए बताओ:\n"
                "• कौन सी फसल बेचनी है?\n"
                "• नज़दीकी मंडी या ज़िला कौन सा है?\n\n"
                "मैं latest rates निकालने की कोशिश करूंगा। "
                "वैसे agmarknet.gov.in पर भी check कर सकते हो।"
            )
        return (
            "To check mandi prices, tell me:\n"
            "• Which crop do you want to sell?\n"
            "• Your nearest mandi or district?\n\n"
            "I'll try to fetch the latest rates. "
            "You can also check agmarknet.gov.in."
        )

    # General / unrecognized
    if is_hi:
        return (
            "भाई, मैं Kishan Sathi AI हूँ — खेती में आपका पक्का साथी।\n\n"
            "मुझसे कुछ भी पूछो:\n"
            "• कौन सी फसल बोऊं?\n"
            "• रोग/कीट का इलाज\n"
            "• खाद कब और कितनी डालें?\n"
            "• पानी कब दें?\n"
            "• मौसम की जानकारी\n"
            "• सरकारी योजनाएं\n"
            "• मंडी के भाव\n\n"
            "बस बोलो या लिखो, मैं हाज़िर हूँ।"
        )
    return (
        "I'm Kishan Sathi AI — your reliable farming assistant.\n\n"
        "Ask me anything:\n"
        "• Which crop to grow?\n"
        "• Disease & pest remedies\n"
        "• Fertilizer schedule\n"
        "• Irrigation tips\n"
        "• Weather updates\n"
        "• Government schemes\n"
        "• Mandi prices\n\n"
        "Just ask — I'm here to help."
    )
