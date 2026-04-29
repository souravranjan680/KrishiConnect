"""
POST /chat  — Kishan Sathi AI voice/text assistant.

Accepts the farmer's spoken/typed question, calls Gemini Flash,
and returns a concise plain-text answer to read aloud.
"""

from __future__ import annotations

import logging
import re

from fastapi import APIRouter, HTTPException
from typing import Optional

from pydantic import BaseModel, Field

from app.config import settings
from app.services.ai_service import get_ai_response
from app.services.fallback_assistant import fallback_reply

logger = logging.getLogger(__name__)
router = APIRouter()


_COORD_PATTERN = re.compile(r"\(?\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*\)?")
_EMOJI_PATTERN = re.compile(r"[\U0001F300-\U0001FAFF\u2600-\u27BF\u200D\uFE0F]+", re.UNICODE)


async def _sanitize_reply(reply: str, *, lat: float | None, lon: float | None, village: str | None, lang: str) -> str:
    text = (reply or "").strip()
    if not text:
        return text

    # Remove emojis so TTS and manual FAQ style stay clean/professional.
    text = _EMOJI_PATTERN.sub("", text)

    # Prefer human-readable place name over raw coordinates.
    place = (village or "").strip()
    if not place and lat is not None and lon is not None:
        try:
            from app.services.geocoding import reverse_geocode

            place = (await reverse_geocode(float(lat), float(lon))).strip()
        except Exception:
            place = ""

    replacement = place or ("आपकी लोकेशन" if lang.startswith("hi") else "your location")
    text = _COORD_PATTERN.sub(replacement, text)

    # Clean spacing left after replacements.
    text = re.sub(r"\s{2,}", " ", text).strip()
    return text


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000,
                         description="Farmer's question in Hindi or English.")
    lang: str    = Field(default="en", max_length=5,
                         description="UI language hint ('hi' or 'en').")

    # Conversation history for multi-turn context
    history: Optional[list] = Field(default=None,
                                    description="Previous messages [{role, text}, ...]")

    # Optional context to make answers more accurate without LLM.
    village: Optional[str] = Field(default=None, max_length=200)
    lat: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    lon: Optional[float] = Field(default=None, ge=-180.0, le=180.0)


class ChatResponse(BaseModel):
    reply: str = Field(..., description="AI assistant's response (plain text).")


@router.post("/chat", response_model=ChatResponse, tags=["AI Assistant"])
async def chat(req: ChatRequest) -> ChatResponse:
    """
    AI farming assistant powered by Gemini Flash (free tier).
    - Send the farmer's voice/text query.
    - Returns a concise, practical reply in the same language.
    """
    # If no GEMINI_API_KEY is configured, fall back to a free rule-based assistant
    # so the feature still works without any external API.
    if not (settings.gemini_api_key or "").strip():
        reply = await fallback_reply(
            req.message,
            lang_hint=req.lang,
            village=req.village,
            lat=req.lat,
            lon=req.lon,
        )
        reply = await _sanitize_reply(
            reply,
            lat=req.lat,
            lon=req.lon,
            village=req.village,
            lang=req.lang,
        )
        return ChatResponse(reply=reply)

    try:
        reply = await get_ai_response(req.message, lang_hint=req.lang, history=req.history)
        reply = await _sanitize_reply(
            reply,
            lat=req.lat,
            lon=req.lon,
            village=req.village,
            lang=req.lang,
        )
        return ChatResponse(reply=reply)

    except Exception as exc:
        # If Gemini fails for any reason, fall back to the free rule-based
        # assistant so the farmer still gets a useful answer.
        logger.warning("Gemini failed (%s), falling back to rule-based assistant.", exc)
        try:
            reply = await fallback_reply(
                req.message,
                lang_hint=req.lang,
                village=req.village,
                lat=req.lat,
                lon=req.lon,
            )
            reply = await _sanitize_reply(
                reply,
                lat=req.lat,
                lon=req.lon,
                village=req.village,
                lang=req.lang,
            )
            return ChatResponse(reply=reply)
        except Exception as fb_exc:
            logger.exception("Fallback assistant also failed: %s", fb_exc)
            raise HTTPException(
                status_code=503,
                detail=f"AI service temporarily unavailable: {exc}",
            ) from fb_exc
