"""
Pydantic schemas for the API.
These are the single source of truth for request/response shapes.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


# ─── Recommend ───────────────────────────────────────────────────────────────


class RecommendRequest(BaseModel):
    """Accepts either village name or GPS coordinates (or both)."""

    village: Optional[str] = Field(default=None, min_length=1, max_length=200)
    lat: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    lon: Optional[float] = Field(default=None, ge=-180.0, le=180.0)


class Advice(BaseModel):
    planting: str
    water: str
    fertilizer: str


class CropRecommendation(BaseModel):
    crop: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    why: str
    advice: Advice


class WeatherInfo(BaseModel):
    """Real-time weather data used for the prediction."""
    temperature: float   # °C
    humidity: float      # %
    rainfall: float      # mm (last 30 days)


class SoilInfo(BaseModel):
    """Soil data used for the prediction."""
    N: float       # cg/kg total nitrogen
    P: float       # mg/kg estimated phosphorus
    K: float       # mg/kg estimated potassium
    ph: float      # pH in water


class RecommendResponse(BaseModel):
    recommendation_id: str
    recommendations: list[CropRecommendation]
    weather: Optional[WeatherInfo] = None
    soil: Optional[SoilInfo] = None
    location: Optional[dict] = None   # {"lat": …, "lon": …, "display": "…"}
    note: Optional[str] = None


# ─── Feedback ────────────────────────────────────────────────────────────────


class FeedbackRequest(BaseModel):
    recommendation_id: str = Field(..., min_length=1, max_length=64)
    helpful: bool
    comment: Optional[str] = Field(default=None, max_length=1000)


class FeedbackResponse(BaseModel):
    ok: bool = True


# ─── Admin ───────────────────────────────────────────────────────────────────


class MetricsResponse(BaseModel):
    total_recommend_requests: int
    total_feedback: int
    helpful_yes: int
    helpful_no: int


class FeedbackRow(BaseModel):
    id: int
    recommendation_id: str
    helpful: bool
    comment: Optional[str]
    created_at: str


    model_config = {"from_attributes": True}
