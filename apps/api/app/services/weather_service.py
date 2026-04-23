"""
Weather service.

Primary source : Open-Meteo (https://open-meteo.com) — completely free, no API
                 key required, open-source, works globally.
                 - Current temperature & humidity from forecast endpoint
                 - Monthly rainfall = sum of daily precipitation for the last 30 days

Fallback       : OpenWeatherMap — set OPENWEATHER_API_KEY in .env to enable.
                 Used automatically if Open-Meteo is unreachable.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

_OPEN_METEO_FORECAST = "https://api.open-meteo.com/v1/forecast"


@dataclass
class WeatherData:
    temperature: float  # Celsius
    humidity: float     # %
    rainfall: float     # mm — sum of last 30 days of daily precipitation


# ─── Public interface ─────────────────────────────────────────────────────────

async def get_weather_by_coords(lat: float, lon: float) -> WeatherData:
    """Fetch real weather data for given lat/lon."""
    try:
        return await _open_meteo(lat, lon)
    except Exception as e:
        logger.warning("Open-Meteo failed (%s). Trying OpenWeatherMap.", e)

    if settings.openweather_api_key:
        try:
            return await _openweathermap_coords(lat, lon)
        except Exception as e2:
            logger.warning("OpenWeatherMap also failed: %s", e2)

    logger.error("All weather APIs failed. Using stub values.")
    return _stub_weather()


async def get_weather_by_village(village: str) -> WeatherData:
    """Geocode village → coords, then fetch weather. Caller should prefer GPS."""
    from app.services.geocoding import geocode
    lat, lon = await geocode(village)
    return await get_weather_by_coords(lat, lon)


# ─── Backends ─────────────────────────────────────────────────────────────────

async def _open_meteo(lat: float, lon: float) -> WeatherData:
    """
    Open-Meteo free API.
    - current: temperature_2m, relative_humidity_2m
    - daily precipitation_sum for the last 30 days → monthly rainfall
    """
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m",
        "daily": "precipitation_sum",
        "past_days": 30,
        "forecast_days": 1,
        "timezone": "auto",
    }
    async with httpx.AsyncClient(timeout=12) as client:
        resp = await client.get(_OPEN_METEO_FORECAST, params=params)
        resp.raise_for_status()
        data = resp.json()

    temperature = data["current"]["temperature_2m"]
    humidity    = data["current"]["relative_humidity_2m"]
    daily_rain  = data.get("daily", {}).get("precipitation_sum", []) or []
    rainfall    = sum(v for v in daily_rain if v is not None)

    logger.info("Open-Meteo: temp=%.1f°C hum=%.0f%% rain=%.1fmm", temperature, humidity, rainfall)
    return WeatherData(temperature=temperature, humidity=humidity, rainfall=rainfall)


async def _openweathermap_coords(lat: float, lon: float) -> WeatherData:
    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {"lat": lat, "lon": lon, "appid": settings.openweather_api_key, "units": "metric"}
    async with httpx.AsyncClient(timeout=8) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()
    return WeatherData(
        temperature=data["main"]["temp"],
        humidity=data["main"]["humidity"],
        rainfall=data.get("rain", {}).get("1h", 0.0) * 720,
    )


def _stub_weather() -> WeatherData:
    """Last-resort fallback. Approximate north-Indian Kharif season conditions."""
    return WeatherData(temperature=25.0, humidity=65.0, rainfall=120.0)
