"""
Recommendation service (50 Indian crops).

Ties together soil, weather and ML inference.
"""

from __future__ import annotations

import uuid

from app.ml.inference import InputFeatures, predict_top_n
from app.schemas import Advice, CropRecommendation, RecommendResponse
from app.services.soil_service import SoilData
from app.services.weather_service import WeatherData

# ---------------------------------------------------------------------------
# Crop advice dictionary (50 crops)
# ---------------------------------------------------------------------------

_ADVICE: dict[str, Advice] = {
    # -- Cereals --
    "Rice": Advice(
        planting="June-July (Kharif) or Nov-Jan (Rabi in south)",
        water="Requires flooded paddy; 1200-2000 mm per season",
        fertilizer="120:60:60 NPK kg/ha; urea in 2 splits at basal + tillering",
    ),
    "Wheat": Advice(
        planting="October-November (Rabi season)",
        water="4-6 irrigations; critical at crown root & heading",
        fertilizer="120:60:40 NPK kg/ha; split N in 2 doses",
    ),
    "Maize": Advice(
        planting="June-July (Kharif); Feb-Mar (spring)",
        water="2-3 irrigations; avoid waterlogging",
        fertilizer="120:60:40 NPK; top-dress urea at knee height",
    ),
    "Barley": Advice(
        planting="October-November (Rabi)",
        water="2-3 irrigations; tolerates drought better than wheat",
        fertilizer="60:30:20 NPK kg/ha; single basal application works",
    ),
    "Bajra": Advice(
        planting="June-July (Kharif); very drought-tolerant millet",
        water="Minimal irrigation; rainfed works well (300-500 mm)",
        fertilizer="60:30:30 NPK kg/ha; FYM 5 t/ha improves yield",
    ),
    "Jowar": Advice(
        planting="June-July (Kharif) or Oct (Rabi sorghum)",
        water="Rainfed friendly; 1-2 irrigations if available",
        fertilizer="80:40:40 NPK kg/ha; Zinc sulphate 25 kg helps",
    ),
    "Ragi": Advice(
        planting="June-July; transplant 25-day seedlings",
        water="Moderate; finger millet is fairly drought-tolerant",
        fertilizer="50:40:25 NPK kg/ha; FYM 10 t/ha as base",
    ),

    # -- Pulses --
    "Chickpea": Advice(
        planting="October-November (Rabi); seed rate 80-100 kg/ha",
        water="1-2 irrigations only; drought-tolerant",
        fertilizer="Rhizobium inoculant; 20:40:20 NPK kg/ha",
    ),
    "Lentil": Advice(
        planting="October-November (Rabi)",
        water="1 irrigation sufficient; 60-75 mm ideal",
        fertilizer="15:40:20 NPK; Rhizobium seed treatment recommended",
    ),
    "Peas": Advice(
        planting="October-November (Rabi); seed rate 80-100 kg/ha",
        water="3-4 light irrigations; sensitive to waterlogging",
        fertilizer="25:60:40 NPK; Rhizobium + PSB seed treatment",
    ),

    # -- Oilseeds --
    "Soybean": Advice(
        planting="June-July (Kharif); seed rate 60-75 kg/ha",
        water="Moderate; avoid waterlogging",
        fertilizer="Rhizobium inoculant; 20:60:20 NPK starter",
    ),
    "Groundnut": Advice(
        planting="June-July (Kharif); Jan-Feb (Rabi/summer)",
        water="Light irrigation at pegging & pod-filling",
        fertilizer="Low N (fixes own); 25:50:75 NPK; gypsum 500 kg/ha at pegging",
    ),
    "Mustard": Advice(
        planting="October-November (Rabi); seed rate 4-5 kg/ha",
        water="2-3 irrigations; critical at flowering & pod filling",
        fertilizer="60:40:20 NPK kg/ha; sulphur 20 kg boosts oil content",
    ),
    "Sunflower": Advice(
        planting="Jan-Feb (spring) or June-July; seed rate 5-8 kg/ha",
        water="4-5 irrigations; critical at star-bud & flowering",
        fertilizer="80:60:30 NPK kg/ha; boron spray at bud stage",
    ),
    "Sesame": Advice(
        planting="June-July (Kharif); seed rate 4-5 kg/ha",
        water="Rainfed crop; 1-2 irrigations in dry spells",
        fertilizer="40:20:20 NPK; avoid excess nitrogen",
    ),

    # -- Cash / Fiber --
    "Cotton": Advice(
        planting="April-May after last frost; Bt hybrids popular",
        water="Drip irrigation preferred; 700-1200 mm total",
        fertilizer="120:60:60 NPK; avoid excess N (delays boll opening)",
    ),
    "Sugarcane": Advice(
        planting="Feb-Mar (spring); Oct (autumn planting in south)",
        water="High demand 1500-2500 mm; weekly irrigation in dry season",
        fertilizer="250:60:120 NPK; earthing-up at 70 & 120 days",
    ),
    "Jute": Advice(
        planting="March-May; needs warm humid climate (Bengal, Bihar, Assam)",
        water="Requires waterlogged conditions; 1500+ mm rainfall",
        fertilizer="60:30:30 NPK kg/ha; organic manure improves fibre quality",
    ),
    "Tobacco": Advice(
        planting="Sept-Oct nursery; transplant after 45 days",
        water="Light frequent irrigations; 500-600 mm total",
        fertilizer="90:40:60 NPK; avoid excess N which reduces leaf quality",
    ),

    # -- Plantation --
    "Tea": Advice(
        planting="Plant cuttings in Oct-Nov; shade trees essential",
        water="Needs well-distributed rainfall 1800-2500 mm; no standing water",
        fertilizer="120:60:60 NPK per hectare per year; acidic soil needed",
    ),
    "Coffee": Advice(
        planting="Seedlings planted during monsoon onset (June-July)",
        water="Blossom showers critical; 1500-2500 mm well-distributed",
        fertilizer="100:50:100 NPK per ha; shade management important",
    ),
    "Rubber": Advice(
        planting="June-July in main field; 450-500 trees per hectare",
        water="Needs 2000+ mm rainfall; irrigation in dry areas",
        fertilizer="N:P:K 10:10:4 mixture; 300 g per tree per year (mature)",
    ),
    "Coconut": Advice(
        planting="Pre-monsoon (May-June); 7.5m x 7.5m spacing",
        water="Regular irrigation needed; 600-800 mm during dry months",
        fertilizer="500:320:1200 g NPK per palm per year; organic manure 25 kg",
    ),
    "Arecanut": Advice(
        planting="May-June; 2.7m x 2.7m spacing in pits",
        water="Regular irrigation essential; mulching helps conserve moisture",
        fertilizer="100:40:140 g NPK per palm; apply in 2 splits",
    ),
    "Cashew": Advice(
        planting="June-July; 8m x 8m spacing for grafted varieties",
        water="First 2-3 years need irrigation; mature trees are hardy",
        fertilizer="500:125:125 g NPK per tree per year; micronutrients help",
    ),

    # -- Spices --
    "BlackPepper": Advice(
        planting="May-June with onset of SW monsoon; on support trees",
        water="Well-distributed rainfall 2000+ mm; mulching essential",
        fertilizer="50:50:150 g NPK per vine; Trichoderma for root health",
    ),
    "Cardamom": Advice(
        planting="June-July in shaded forest land; 2m x 2m spacing",
        water="Needs 2000-3000 mm rainfall; loves misty conditions",
        fertilizer="75:75:150 g NPK per clump; mulch with dried leaves",
    ),
    "Clove": Advice(
        planting="June-July saplings in main field; 6m x 6m",
        water="Thrives in humid tropics; regular rainfall needed",
        fertilizer="20:18:50 g NPK in early years; increase with age",
    ),
    "Ginger": Advice(
        planting="April-May with pre-monsoon showers; rhizome 15-25 g pieces",
        water="Requires consistent moisture; drip irrigation ideal",
        fertilizer="75:50:50 NPK kg/ha; neem cake 2 t/ha for pest control",
    ),
    "Turmeric": Advice(
        planting="April-May; mother and finger rhizomes as seed",
        water="Consistent moisture needed; 1200-1500 mm rainfall",
        fertilizer="60:50:120 NPK kg/ha; FYM 25 t/ha; earthing up 2x",
    ),
    "Garlic": Advice(
        planting="October-November (Rabi); cloves at 10 cm spacing",
        water="Light frequent irrigations; 6-8 irrigations total",
        fertilizer="50:50:50 NPK kg/ha; sulphur 40 kg/ha improves quality",
    ),
    "Coriander": Advice(
        planting="October-November (Rabi); seed rate 15-20 kg/ha",
        water="3-4 irrigations; avoid water stress at flowering",
        fertilizer="40:20:20 NPK; FYM 10 t/ha as basal",
    ),
    "Cumin": Advice(
        planting="November-December (Rabi); seed rate 12-15 kg/ha",
        water="3-4 light irrigations; avoid excess moisture",
        fertilizer="30:20:0 NPK; neem cake for wilt management",
    ),

    # -- Fruits --
    "Mango": Advice(
        planting="June-July (grafted saplings); 10m x 10m spacing",
        water="First 2 years: regular; mature trees: rest in winter",
        fertilizer="600:200:600 g NPK per adult tree; increase P at flowering",
    ),
    "Banana": Advice(
        planting="Feb-Mar or Sept-Oct; sword suckers preferred",
        water="High water requirement; drip + fertigation ideal",
        fertilizer="200:60:300 g NPK per plant; apply in 4-5 splits",
    ),
    "Papaya": Advice(
        planting="June-July or Sept-Oct; 2.5m x 2.5m spacing",
        water="Regular irrigation essential; avoid waterlogging",
        fertilizer="200:200:250 g NPK per plant per year; organic mulch",
    ),
    "Guava": Advice(
        planting="June-Sept (monsoon planting); 6m x 6m spacing",
        water="Drought-tolerant once established; irrigate in fruiting",
        fertilizer="260:320:260 g NPK per tree; FYM 25 kg per tree",
    ),
    "Pomegranate": Advice(
        planting="June-July or Feb-Mar; 5m x 4m spacing",
        water="Drip irrigation recommended; stress-then-irrigate for bahar",
        fertilizer="250:125:125 g NPK per plant; micronutrient spray at flowering",
    ),
    "Grape": Advice(
        planting="Dec-Jan cuttings; Thompson Seedless popular in Maharashtra",
        water="Drip + fertigation; controlled water stress for sweetness",
        fertilizer="500:700:700 g NPK per vine; split into 12 monthly doses",
    ),
    "Orange": Advice(
        planting="June-Aug rooted seedlings; 6m x 6m spacing",
        water="15-20 irrigations/year; critical at flowering & fruit set",
        fertilizer="600:200:250 g NPK per tree; zinc & boron micronutrient sprays",
    ),
    "Watermelon": Advice(
        planting="Feb-Mar (summer); Nov (Rabi in south)",
        water="Furrow irrigation every 5-7 days; avoid wetting vines",
        fertilizer="100:50:50 NPK kg/ha; potash increases sweetness",
    ),
    "Jackfruit": Advice(
        planting="June-Sept; grafted varieties fruit in 3-4 years",
        water="Low-maintenance tree; irrigate only in first 2 years",
        fertilizer="30:10:30 g NPK in year 1; increase 10% every year",
    ),

    # -- Vegetables --
    "Tomato": Advice(
        planting="June-July (Kharif); Oct-Nov (Rabi); nursery + transplant",
        water="Regular irrigation; drip preferred; 600-800 mm total",
        fertilizer="120:80:80 NPK kg/ha; calcium spray prevents blossom-end rot",
    ),
    "Onion": Advice(
        planting="Kharif: May-June; Rabi: Nov-Jan; Late Kharif: Aug-Sept",
        water="Frequent shallow irrigations; critical at bulb formation",
        fertilizer="100:50:50 NPK kg/ha; sulphur 30 kg/ha for pungency",
    ),
    "Potato": Advice(
        planting="Oct-Nov (plains); Feb-Mar (hills); certified seed tubers",
        water="8-10 irrigations; critical at tuber initiation",
        fertilizer="150:80:100 NPK kg/ha; FYM 25 t/ha; earthing up 2x",
    ),
    "Brinjal": Advice(
        planting="June-July (Kharif); Oct-Nov (Rabi); nursery 25-30 days",
        water="Regular irrigation; mulching conserves moisture",
        fertilizer="100:50:50 NPK kg/ha; neem cake 250 kg for pest control",
    ),
    "Cabbage": Advice(
        planting="Sept-Oct nursery; transplant at 30 days; cool season crop",
        water="Regular light irrigations; needs consistent moisture",
        fertilizer="120:60:60 NPK kg/ha; boron 1 kg/ha prevents hollow stem",
    ),
    "Cauliflower": Advice(
        planting="Jun-Jul (early); Sept-Oct (main); Dec (late); cool climate",
        water="Regular frequent irrigations; moisture stress causes browning",
        fertilizer="120:60:60 NPK kg/ha; molybdenum spray prevents whiptail",
    ),
    "Okra": Advice(
        planting="Feb-Apr (summer); June-July (Kharif); seed rate 8-10 kg/ha",
        water="Irrigate every 4-5 days; drought-sensitive at flowering",
        fertilizer="60:30:30 NPK kg/ha; pick fruits every 2 days for quality",
    ),
    "Chilli": Advice(
        planting="May-June (Kharif); Sept-Oct (Rabi); transplant 40-day seedlings",
        water="Regular irrigation; drip saves 40% water; 800-1200 mm total",
        fertilizer="100:50:50 NPK kg/ha; potash increases pungency & colour",
    ),
}

_DEFAULT_ADVICE = Advice(
    planting="Consult your local extension officer for planting windows.",
    water="Follow standard irrigation guidelines for your region.",
    fertilizer="Get a local soil test for precise fertilizer recommendation.",
)


def _why(crop: str, f: InputFeatures) -> str:
    """Generate a plain-language explanation for why a crop is recommended."""
    parts = []
    if f.temperature >= 28:
        parts.append("warm climate")
    elif f.temperature >= 20:
        parts.append("moderate temperature")
    else:
        parts.append("cool climate")
    if f.humidity >= 70:
        parts.append("high humidity")
    elif f.humidity >= 50:
        parts.append("moderate humidity")
    if f.rainfall >= 150:
        parts.append("good rainfall")
    elif f.rainfall >= 60:
        parts.append("moderate rainfall")
    else:
        parts.append("low water matched")
    if f.N >= 100:
        parts.append("nitrogen-rich soil")
    return (
        f"Suitable for {crop.lower()} because of "
        f"{', '.join(parts)} and soil conditions "
        f"(N={f.N:.0f}, pH={f.ph:.1f})."
    )


def get_recommendations(
    soil: SoilData,
    weather: WeatherData,
    top_n: int = 3,
) -> RecommendResponse:
    features = InputFeatures(
        N=soil.N,
        P=soil.P,
        K=soil.K,
        ph=soil.ph,
        temperature=weather.temperature,
        humidity=weather.humidity,
        rainfall=weather.rainfall,
    )

    predictions = predict_top_n(features, n=top_n)

    recs = [
        CropRecommendation(
            crop=p.crop,
            confidence=p.probability,
            why=_why(p.crop, features),
            advice=_ADVICE.get(p.crop, _DEFAULT_ADVICE),
        )
        for p in predictions
    ]

    return RecommendResponse(
        recommendation_id=uuid.uuid4().hex,
        recommendations=recs,
    )
