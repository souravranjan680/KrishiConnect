"""
ML inference wrapper (50 Indian crops).

Loads a trained scikit-learn pipeline from disk (model.joblib).
If the artifact does not exist, falls back to a rule-based stub that returns
plausible results so the rest of the system is functional.
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import numpy as np

from app.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------


@dataclass
class InputFeatures:
    N: float
    P: float
    K: float
    ph: float
    temperature: float
    humidity: float
    rainfall: float


@dataclass
class CropPrediction:
    crop: str
    probability: float  # 0..1


# ---------------------------------------------------------------------------
# Model loader (singleton per process)
# ---------------------------------------------------------------------------

_model = None
_classes: list[str] = []

_MAX_MODEL_SIZE_MB = 80


def _load_model():
    global _model, _classes  # noqa: PLW0603

    if os.getenv("DISABLE_ML_MODEL", "").strip().lower() in {"1", "true", "yes", "on"}:
        logger.warning("DISABLE_ML_MODEL is enabled - using rule-based fallback predictions.")
        _model = None
        _classes = []
        return _model

    if _model is not None:
        return _model

    artifact_path = Path(settings.model_artifact_path)

    if not artifact_path.is_absolute():
        # Resolve relative paths from the current working directory.
        # On Render, cwd == apps/api (rootDir), so "ml_artifacts/model.joblib"
        # correctly points to apps/api/ml_artifacts/model.joblib.
        artifact_path = (Path.cwd() / artifact_path).resolve()

    if artifact_path.exists():
        import joblib
        size_mb = artifact_path.stat().st_size / (1024 * 1024)
        if size_mb > _MAX_MODEL_SIZE_MB:
            logger.warning(
                "Model artifact at %s is %.1fMB (> %dMB). Skipping load to protect low-memory runtime.",
                artifact_path,
                size_mb,
                _MAX_MODEL_SIZE_MB,
            )
            _model = None
            _classes = []
            return _model
        try:
            _model = joblib.load(str(artifact_path))
            _classes = list(_model.classes_)
            logger.info("ML model loaded from %s (%d classes)", artifact_path, len(_classes))
        except Exception as exc:
            logger.exception("Failed to load model artifact at %s: %s", artifact_path, exc)
            logger.warning("Falling back to rule-based predictions to keep API healthy.")
            _model = None
            _classes = []
    else:
        logger.warning(
            "Model artifact not found at %s - using rule-based stub. "
            "Train the model with: python ml/scripts/train.py",
            artifact_path,
        )
        _model = None
        _classes = []

    return _model


# ---------------------------------------------------------------------------
# Public interface
# ---------------------------------------------------------------------------


def predict_top_n(features: InputFeatures, n: int = 3) -> list[CropPrediction]:
    """Return top-n crop predictions sorted by probability (descending)."""
    model = _load_model()

    if model is None:
        top = _stub_predictions(features)[:n]
        top_total = sum(p.probability for p in top) or 1.0
        return [
            CropPrediction(crop=p.crop, probability=round(p.probability / top_total, 4))
            for p in top
        ]

    X = np.array(
        [[features.N, features.P, features.K, features.ph,
          features.temperature, features.humidity, features.rainfall]]
    )

    proba = model.predict_proba(X)[0]
    indices = np.argsort(proba)[::-1][:n]

    return [
        CropPrediction(crop=_classes[i], probability=float(proba[i]))
        for i in indices
    ]


# ---------------------------------------------------------------------------
# Rule-based stub (50 crops fallback when model missing)
# ---------------------------------------------------------------------------

_STUB_PROFILES = {
    "Rice":         dict(temp=(20,36), hum=(70,95), rain=(150,320), N=(100,220), ph=(5.0,7.0)),
    "Wheat":        dict(temp=(8,24),  hum=(45,75), rain=(40,130),  N=(80,160),  ph=(6.0,8.0)),
    "Maize":        dict(temp=(18,34), hum=(50,82), rain=(55,200),  N=(80,160),  ph=(5.5,7.5)),
    "Barley":       dict(temp=(5,22),  hum=(35,65), rain=(25,100),  N=(60,130),  ph=(6.0,8.5)),
    "Bajra":        dict(temp=(25,42), hum=(30,65), rain=(25,80),   N=(40,100),  ph=(6.5,8.5)),
    "Jowar":        dict(temp=(25,40), hum=(35,72), rain=(35,120),  N=(50,120),  ph=(6.0,8.5)),
    "Ragi":         dict(temp=(20,32), hum=(50,80), rain=(60,150),  N=(40,100),  ph=(5.0,7.5)),
    "Chickpea":     dict(temp=(8,27),  hum=(35,68), rain=(20,105),  N=(28,90),   ph=(6.5,9.0)),
    "Lentil":       dict(temp=(8,26),  hum=(30,62), rain=(15,85),   N=(28,85),   ph=(6.5,9.0)),
    "Peas":         dict(temp=(7,22),  hum=(55,80), rain=(40,100),  N=(25,80),   ph=(6.0,7.5)),
    "Soybean":      dict(temp=(18,32), hum=(58,88), rain=(75,195),  N=(25,90),   ph=(5.5,7.5)),
    "Groundnut":    dict(temp=(24,40), hum=(45,78), rain=(45,135),  N=(50,120),  ph=(5.5,7.0)),
    "Mustard":      dict(temp=(10,25), hum=(40,70), rain=(25,80),   N=(60,120),  ph=(6.0,8.0)),
    "Sunflower":    dict(temp=(18,35), hum=(40,72), rain=(50,120),  N=(60,130),  ph=(6.0,8.0)),
    "Sesame":       dict(temp=(25,40), hum=(40,70), rain=(30,80),   N=(30,80),   ph=(5.5,8.0)),
    "Cotton":       dict(temp=(24,40), hum=(45,78), rain=(45,145),  N=(100,175), ph=(6.0,8.0)),
    "Sugarcane":    dict(temp=(22,40), hum=(65,92), rain=(140,300), N=(110,200), ph=(6.0,7.5)),
    "Jute":         dict(temp=(24,37), hum=(70,95), rain=(150,300), N=(80,150),  ph=(5.5,7.5)),
    "Tobacco":      dict(temp=(20,35), hum=(50,80), rain=(50,120),  N=(70,150),  ph=(5.5,7.0)),
    "Tea":          dict(temp=(15,28), hum=(70,95), rain=(180,350), N=(90,180),  ph=(4.5,6.0)),
    "Coffee":       dict(temp=(15,28), hum=(65,90), rain=(150,300), N=(80,160),  ph=(5.0,6.5)),
    "Rubber":       dict(temp=(22,35), hum=(75,95), rain=(200,350), N=(70,140),  ph=(4.5,6.0)),
    "Coconut":      dict(temp=(24,37), hum=(65,92), rain=(100,280), N=(60,130),  ph=(5.5,8.0)),
    "Arecanut":     dict(temp=(22,35), hum=(70,92), rain=(150,300), N=(70,140),  ph=(5.0,7.0)),
    "Cashew":       dict(temp=(24,38), hum=(55,85), rain=(80,200),  N=(40,100),  ph=(5.0,7.0)),
    "BlackPepper":  dict(temp=(20,32), hum=(70,95), rain=(180,320), N=(80,150),  ph=(5.0,6.5)),
    "Cardamom":     dict(temp=(15,28), hum=(70,95), rain=(200,350), N=(70,140),  ph=(5.0,6.5)),
    "Clove":        dict(temp=(22,32), hum=(70,90), rain=(180,300), N=(60,120),  ph=(5.5,7.0)),
    "Ginger":       dict(temp=(20,32), hum=(70,90), rain=(150,280), N=(80,150),  ph=(5.5,7.0)),
    "Turmeric":     dict(temp=(20,35), hum=(65,90), rain=(120,250), N=(80,150),  ph=(5.5,7.5)),
    "Garlic":       dict(temp=(10,25), hum=(40,70), rain=(30,80),   N=(50,110),  ph=(6.0,8.0)),
    "Coriander":    dict(temp=(15,28), hum=(40,70), rain=(30,80),   N=(30,80),   ph=(6.0,8.0)),
    "Cumin":        dict(temp=(20,35), hum=(30,55), rain=(15,50),   N=(25,70),   ph=(7.0,9.0)),
    "Mango":        dict(temp=(22,45), hum=(45,82), rain=(50,180),  N=(70,145),  ph=(5.5,7.5)),
    "Banana":       dict(temp=(22,38), hum=(70,95), rain=(120,280), N=(90,170),  ph=(5.5,7.5)),
    "Papaya":       dict(temp=(22,38), hum=(60,90), rain=(100,250), N=(70,140),  ph=(5.5,7.0)),
    "Guava":        dict(temp=(20,38), hum=(45,80), rain=(60,180),  N=(50,110),  ph=(5.5,8.0)),
    "Pomegranate":  dict(temp=(22,40), hum=(30,65), rain=(20,80),   N=(40,100),  ph=(6.5,8.5)),
    "Grape":        dict(temp=(18,38), hum=(35,70), rain=(20,80),   N=(50,110),  ph=(6.0,8.0)),
    "Orange":       dict(temp=(18,35), hum=(50,80), rain=(80,200),  N=(60,130),  ph=(5.5,7.5)),
    "Watermelon":   dict(temp=(25,42), hum=(45,75), rain=(30,80),   N=(50,110),  ph=(6.0,7.5)),
    "Jackfruit":    dict(temp=(22,38), hum=(65,90), rain=(120,280), N=(60,120),  ph=(5.5,7.5)),
    "Tomato":       dict(temp=(18,32), hum=(50,80), rain=(40,120),  N=(70,140),  ph=(5.5,7.5)),
    "Onion":        dict(temp=(12,28), hum=(45,75), rain=(30,80),   N=(50,110),  ph=(6.0,8.0)),
    "Potato":       dict(temp=(10,25), hum=(60,85), rain=(50,130),  N=(80,160),  ph=(5.0,7.0)),
    "Brinjal":      dict(temp=(20,35), hum=(55,85), rain=(50,150),  N=(60,130),  ph=(5.5,7.5)),
    "Cabbage":      dict(temp=(10,22), hum=(60,85), rain=(50,100),  N=(70,140),  ph=(6.0,7.5)),
    "Cauliflower":  dict(temp=(10,22), hum=(60,85), rain=(50,100),  N=(70,140),  ph=(6.0,7.5)),
    "Okra":         dict(temp=(24,38), hum=(55,85), rain=(60,150),  N=(50,110),  ph=(6.0,8.0)),
    "Chilli":       dict(temp=(20,35), hum=(55,85), rain=(50,120),  N=(60,130),  ph=(5.5,7.5)),
}


def _stub_predictions(f: InputFeatures) -> list[CropPrediction]:
    """Rule-based scoring fallback when trained model is unavailable."""
    scores: list[tuple[str, float]] = []
    for crop, p in _STUB_PROFILES.items():
        s = 1.0
        # Temperature fit
        tl, th = p["temp"]
        if tl <= f.temperature <= th:
            s += 3
        elif abs(f.temperature - (tl+th)/2) < 10:
            s += 1
        # Humidity fit
        hl, hh = p["hum"]
        if hl <= f.humidity <= hh:
            s += 2
        # Rainfall fit
        rl, rh = p["rain"]
        if rl <= f.rainfall <= rh:
            s += 2
        elif abs(f.rainfall - (rl+rh)/2) < 50:
            s += 1
        # N fit
        nl, nh = p["N"]
        if nl <= f.N <= nh:
            s += 1
        # pH fit
        pl, ph_ = p["ph"]
        if pl <= f.ph <= ph_:
            s += 1
        scores.append((crop, s))

    total = sum(s for _, s in scores) or 1.0
    return [
        CropPrediction(crop=c, probability=round(s / total, 4))
        for c, s in sorted(scores, key=lambda x: x[1], reverse=True)
    ]
