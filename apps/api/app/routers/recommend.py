"""
POST /recommend
Accepts village name or GPS coordinates, geocodes if needed, fetches real
soil & weather data, and returns top-3 crop recommendations.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.models import RequestLog, get_session
from app.schemas import RecommendRequest, RecommendResponse, SoilInfo, WeatherInfo
from app.services.recommendation_service import get_recommendations
from app.services.soil_service import get_soil_by_coords
from app.services.weather_service import get_weather_by_coords

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/recommend", response_model=RecommendResponse)
async def recommend(
    req: RecommendRequest,
    session: Session = Depends(get_session),
) -> RecommendResponse:
    # ── 1. Resolve location to (lat, lon) ────────────────────────────────
    has_village = bool(req.village and req.village.strip())
    has_gps     = req.lat is not None and req.lon is not None

    if not has_village and not has_gps:
        raise HTTPException(
            status_code=422,
            detail="Provide either 'village' name or 'lat'/'lon' GPS coordinates.",
        )

    lat: float
    lon: float
    location_display: str

    if has_gps:
        lat, lon = req.lat, req.lon  # type: ignore[assignment]
        # Convert GPS coordinates back to place name (reverse geocoding)
        try:
            from app.services.geocoding import reverse_geocode
            location_display = await reverse_geocode(lat, lon)
        except Exception as exc:
            logger.warning("Reverse geocoding failed: %s, showing coordinates", exc)
            location_display = f"{lat:.4f}, {lon:.4f}"
    else:
        # Geocode village name → lat/lon via Nominatim (free OSM)
        try:
            from app.services.geocoding import geocode
            lat, lon = await geocode(req.village.strip())  # type: ignore[union-attr]
            location_display = req.village.strip()  # type: ignore[union-attr]
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except Exception as exc:
            raise HTTPException(
                status_code=503,
                detail=f"Geocoding service unavailable: {exc}",
            ) from exc

    # ── 2. Fetch real soil & weather data in parallel ─────────────────────
    import asyncio

    try:
        soil, weather = await asyncio.gather(
            get_soil_by_coords(lat, lon),
            get_weather_by_coords(lat, lon),
        )
    except Exception as exc:
        logger.exception("Data fetch failed: %s", exc)
        raise HTTPException(
            status_code=503,
            detail=f"Could not retrieve soil/weather data: {exc}",
        ) from exc

    # ── 3. ML prediction ──────────────────────────────────────────────────
    result = get_recommendations(soil=soil, weather=weather)

    # Attach real data so the frontend can display it
    result.weather  = WeatherInfo(
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
    result.location = {
        "lat": round(lat, 5),
        "lon": round(lon, 5),
        "display": location_display,
    }

    # ── 4. Log request ────────────────────────────────────────────────────
    session.add(RequestLog(
        recommendation_id=result.recommendation_id,
        village=req.village,
        lat=lat,
        lon=lon,
    ))
    session.commit()

    return result

