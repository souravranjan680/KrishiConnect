"""
Soil service.

Primary source : ISRIC World Soil Information — SoilGrids v2.0 REST API
                 (https://rest.isric.org) — completely free, no API key.
                 Returns point-sampled global soil property predictions.

                 Properties fetched (0-30 cm layer):
                   nitrogen  → total N in cg/kg     → converted to model units
                   phh2o     → pH × 10              → divided by 10

                 P and K are estimated from N using agronomic ratios and
                 regional correction because SoilGrids does not provide
                 plant-available P/K globally.

Fallback       : Regional stub values for north-Indian alluvial soil.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

import httpx

logger = logging.getLogger(__name__)

_SOILGRIDS_URL = "https://rest.isric.org/soilgrids/v2.0/properties/query"


@dataclass
class SoilData:
    N: float    # total N (cg/kg) — same scale as training data
    P: float    # estimated plant-available P (mg/kg)
    K: float    # estimated exchangeable K (mg/kg)
    ph: float   # pH in water (0-14 scale)


# ─── Public interface ─────────────────────────────────────────────────────────

async def get_soil_by_coords(lat: float, lon: float) -> SoilData:
    """Fetch real soil data for given lat/lon from ISRIC SoilGrids."""
    try:
        return await _soilgrids(lat, lon)
    except Exception as e:
        logger.warning("SoilGrids failed (%s). Using regional stub.", e)
        return _stub_soil()


async def get_soil_by_village(village: str) -> SoilData:
    """Geocode village → coords, then fetch soil properties."""
    from app.services.geocoding import geocode
    lat, lon = await geocode(village)
    return await get_soil_by_coords(lat, lon)


# ─── Backend ──────────────────────────────────────────────────────────────────

async def _soilgrids(lat: float, lon: float) -> SoilData:
    """
    ISRIC SoilGrids v2.0 REST API.

    Response unit details
    ─────────────────────
    nitrogen : mapped unit = cg/kg  (d_factor = 100, so raw/100 = g/kg)
               raw value 150 → 1.5 g/kg total N
    phh2o    : mapped unit = pH×10  (d_factor = 10,  so raw/10  = pH)
               raw value  68 → pH 6.8
    """
    params = {
        "lon": lon,
        "lat": lat,
        "property": ["nitrogen", "phh2o"],
        "depth": "0-30cm",
        "value": "mean",
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(_SOILGRIDS_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

    # Parse response
    n_raw = ph_raw = None
    for layer in data.get("properties", {}).get("layers", []):
        name = layer.get("name", "")
        depths = layer.get("depths", [])
        if not depths:
            continue
        mean_val = depths[0].get("values", {}).get("mean")
        if mean_val is None:
            continue
        if name == "nitrogen":
            n_raw = mean_val   # cg/kg
        elif name == "phh2o":
            ph_raw = mean_val  # pH × 10

    if n_raw is None or ph_raw is None:
        raise ValueError("SoilGrids returned incomplete data")

    # Convert to model-compatible units
    N = float(n_raw)         # keep as cg/kg → training data uses same scale
    ph = float(ph_raw) / 10  # pH × 10 → pH

    # Estimate P and K from N using agronomic ratios
    # Typical N:P:K ratio in Indian agricultural soils ≈ 4:2:3
    P = N * 0.50 + 10.0   # rough estimate, mg/kg
    K = N * 0.65 + 15.0   # rough estimate, mg/kg

    # Clamp to realistic ranges
    N  = max(10.0,  min(N,  350.0))
    P  = max(5.0,   min(P,  145.0))
    K  = max(5.0,   min(K,  205.0))
    ph = max(3.5,   min(ph,  10.0))

    logger.info("SoilGrids → N=%.1f P=%.1f K=%.1f pH=%.2f", N, P, K, ph)
    return SoilData(N=N, P=P, K=K, ph=ph)


def _stub_soil() -> SoilData:
    """Last-resort fallback: approximate averages for north-Indian alluvial soil."""
    return SoilData(N=120.0, P=55.0, K=70.0, ph=7.2)

