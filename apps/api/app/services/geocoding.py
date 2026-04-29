"""
Geocoding service — converts a village/city name to (lat, lon).

Uses OpenStreetMap Nominatim (free, no API key required).
Rate limit: 1 request/second per the OSM usage policy.
User-Agent header is mandatory per OSM policy.
"""

from __future__ import annotations

import httpx

_NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
_HEADERS = {"User-Agent": "KrishiConnectAI/1.0 (crop-recommendation-system)"}


async def geocode(query: str, country: str = "in") -> tuple[float, float]:
    """
    Return (lat, lon) for *query* (village / city / district name).

    Tries India first; falls back to global search if not found.

    Raises:
        ValueError: if the location cannot be found.
        httpx.HTTPError: on network failure.
    """
    async with httpx.AsyncClient(timeout=10) as client:
        # First try: restrict to India
        params: dict = {
            "q": query,
            "format": "json",
            "limit": 1,
            "countrycodes": country,
        }
        resp = await client.get(_NOMINATIM_URL, params=params, headers=_HEADERS)
        resp.raise_for_status()
        results = resp.json()

        if not results:
            # Second try: global search (handles state/country names too)
            params.pop("countrycodes", None)
            resp = await client.get(_NOMINATIM_URL, params=params, headers=_HEADERS)
            resp.raise_for_status()
            results = resp.json()

    if not results:
        raise ValueError(
            f"Could not find location '{query}'. "
            "Try a nearby city or district name."
        )

    return float(results[0]["lat"]), float(results[0]["lon"])


async def reverse_geocode(lat: float, lon: float) -> str:
    """
    Convert GPS coordinates (lat, lon) back to a place name.
    
    Tries to extract village name first, falls back to city, then district.
    
    Args:
        lat: Latitude coordinate
        lon: Longitude coordinate
    
    Returns:
        Human-readable location name (village, city, or district name)
    
    Raises:
        ValueError: if reverse lookup fails
        httpx.HTTPError: on network failure
    """
    _REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"
    
    async with httpx.AsyncClient(timeout=10) as client:
        params = {
            "lat": lat,
            "lon": lon,
            "format": "json",
        }
        resp = await client.get(_REVERSE_URL, params=params, headers=_HEADERS)
        resp.raise_for_status()
        result = resp.json()
    
    if not result or "address" not in result:
        # Fallback to coordinates if no address found
        return f"{lat:.4f}, {lon:.4f}"
    
    address = result["address"]
    
    # Try to get the most specific location name (village > city > district > town)
    place_name = (
        address.get("village")
        or address.get("town")
        or address.get("city")
        or address.get("district")
        or address.get("state")
        or f"{lat:.4f}, {lon:.4f}"
    )
    
    return place_name
