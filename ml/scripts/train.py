"""
Crop Recommendation Model - Training Script (50 Indian Crops)
==============================================================

Generates a synthetic labelled dataset (~5 000 samples, 50 crops) using
realistic agro-climatic ranges derived from ICAR / FAO literature, then
trains a RandomForest pipeline and saves it as a joblib artifact.

Usage (from repo root):
    python ml/scripts/train.py

Artifact saved to:
    apps/api/ml_artifacts/model.joblib

Features (must match soil / weather service units):
    N           - total nitrogen from SoilGrids (cg/kg)
    P           - estimated plant-available P (mg/kg)
    K           - estimated exchangeable K (mg/kg)
    ph          - soil pH in water (SoilGrids phh2o / 10)
    temperature - mean air temperature C (Open-Meteo)
    humidity    - relative humidity % (Open-Meteo)
    rainfall    - cumulative monthly precipitation mm (Open-Meteo past_days=30)
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

OUTPUT_PATH = ROOT / "apps" / "api" / "ml_artifacts" / "model.joblib"
REPORT_PATH = ROOT / "apps" / "api" / "ml_artifacts" / "eval_report.json"

FEATURE_COLUMNS = ["N", "P", "K", "ph", "temperature", "humidity", "rainfall"]
TARGET_COLUMN   = "label"
SAMPLES_PER_CROP = 80           # 80 x 50 = 4 000 (+ centroid bonus)
RNG = np.random.default_rng(42)


# ------------------------------------------------------------------
# 50 Indian Crop agro-climatic profiles
# Each tuple: (low, high) for the feature
# Sources: ICAR handbooks, FAO EcoCrop, Krishi Vigyan Kendra sheets
# ------------------------------------------------------------------

CROP_PROFILES: dict[str, dict[str, tuple[float, float]]] = {
    # ---- Cereals ----
    "Rice": dict(
        N=(100, 220), P=(40, 90),  K=(40, 90),  ph=(5.0, 7.0),
        temperature=(20, 36), humidity=(70, 95), rainfall=(150, 320),
    ),
    "Wheat": dict(
        N=(80, 160),  P=(30, 70),  K=(30, 70),  ph=(6.0, 8.0),
        temperature=(8, 24),  humidity=(45, 75), rainfall=(40, 130),
    ),
    "Maize": dict(
        N=(80, 160),  P=(35, 75),  K=(35, 75),  ph=(5.5, 7.5),
        temperature=(18, 34), humidity=(50, 82), rainfall=(55, 200),
    ),
    "Barley": dict(
        N=(60, 130),  P=(25, 60),  K=(25, 60),  ph=(6.0, 8.5),
        temperature=(5, 22),  humidity=(35, 65), rainfall=(25, 100),
    ),
    "Bajra": dict(  # Pearl Millet
        N=(40, 100),  P=(20, 50),  K=(20, 50),  ph=(6.5, 8.5),
        temperature=(25, 42), humidity=(30, 65), rainfall=(25, 80),
    ),
    "Jowar": dict(  # Sorghum
        N=(50, 120),  P=(25, 55),  K=(25, 55),  ph=(6.0, 8.5),
        temperature=(25, 40), humidity=(35, 72), rainfall=(35, 120),
    ),
    "Ragi": dict(   # Finger Millet
        N=(40, 100),  P=(20, 50),  K=(20, 50),  ph=(5.0, 7.5),
        temperature=(20, 32), humidity=(50, 80), rainfall=(60, 150),
    ),

    # ---- Pulses ----
    "Chickpea": dict(
        N=(28, 90),   P=(50, 95),  K=(50, 95),  ph=(6.5, 9.0),
        temperature=(8, 27),  humidity=(35, 68), rainfall=(20, 105),
    ),
    "Lentil": dict(
        N=(28, 85),   P=(55, 95),  K=(55, 95),  ph=(6.5, 9.0),
        temperature=(8, 26),  humidity=(30, 62), rainfall=(15, 85),
    ),
    "Peas": dict(
        N=(25, 80),   P=(40, 80),  K=(40, 80),  ph=(6.0, 7.5),
        temperature=(7, 22),  humidity=(55, 80), rainfall=(40, 100),
    ),

    # ---- Oilseeds ----
    "Soybean": dict(
        N=(25, 90),   P=(35, 70),  K=(35, 70),  ph=(5.5, 7.5),
        temperature=(18, 32), humidity=(58, 88), rainfall=(75, 195),
    ),
    "Groundnut": dict(
        N=(50, 120),  P=(40, 80),  K=(25, 65),  ph=(5.5, 7.0),
        temperature=(24, 40), humidity=(45, 78), rainfall=(45, 135),
    ),
    "Mustard": dict(
        N=(60, 120),  P=(30, 60),  K=(25, 55),  ph=(6.0, 8.0),
        temperature=(10, 25), humidity=(40, 70), rainfall=(25, 80),
    ),
    "Sunflower": dict(
        N=(60, 130),  P=(30, 65),  K=(30, 65),  ph=(6.0, 8.0),
        temperature=(18, 35), humidity=(40, 72), rainfall=(50, 120),
    ),
    "Sesame": dict(
        N=(30, 80),   P=(20, 50),  K=(20, 50),  ph=(5.5, 8.0),
        temperature=(25, 40), humidity=(40, 70), rainfall=(30, 80),
    ),

    # ---- Cash / Fiber crops ----
    "Cotton": dict(
        N=(100, 175), P=(30, 65),  K=(30, 65),  ph=(6.0, 8.0),
        temperature=(24, 40), humidity=(45, 78), rainfall=(45, 145),
    ),
    "Sugarcane": dict(
        N=(110, 200), P=(50, 95),  K=(50, 95),  ph=(6.0, 7.5),
        temperature=(22, 40), humidity=(65, 92), rainfall=(140, 300),
    ),
    "Jute": dict(
        N=(80, 150),  P=(30, 60),  K=(25, 55),  ph=(5.5, 7.5),
        temperature=(24, 37), humidity=(70, 95), rainfall=(150, 300),
    ),
    "Tobacco": dict(
        N=(70, 150),  P=(30, 65),  K=(40, 80),  ph=(5.5, 7.0),
        temperature=(20, 35), humidity=(50, 80), rainfall=(50, 120),
    ),

    # ---- Plantation crops ----
    "Tea": dict(
        N=(90, 180),  P=(20, 50),  K=(30, 60),  ph=(4.5, 6.0),
        temperature=(15, 28), humidity=(70, 95), rainfall=(180, 350),
    ),
    "Coffee": dict(
        N=(80, 160),  P=(20, 50),  K=(30, 65),  ph=(5.0, 6.5),
        temperature=(15, 28), humidity=(65, 90), rainfall=(150, 300),
    ),
    "Rubber": dict(
        N=(70, 140),  P=(20, 45),  K=(25, 55),  ph=(4.5, 6.0),
        temperature=(22, 35), humidity=(75, 95), rainfall=(200, 350),
    ),
    "Coconut": dict(
        N=(60, 130),  P=(20, 50),  K=(50, 110), ph=(5.5, 8.0),
        temperature=(24, 37), humidity=(65, 92), rainfall=(100, 280),
    ),
    "Arecanut": dict(
        N=(70, 140),  P=(20, 50),  K=(40, 80),  ph=(5.0, 7.0),
        temperature=(22, 35), humidity=(70, 92), rainfall=(150, 300),
    ),
    "Cashew": dict(
        N=(40, 100),  P=(15, 40),  K=(20, 50),  ph=(5.0, 7.0),
        temperature=(24, 38), humidity=(55, 85), rainfall=(80, 200),
    ),

    # ---- Spices ----
    "BlackPepper": dict(
        N=(80, 150),  P=(25, 55),  K=(40, 80),  ph=(5.0, 6.5),
        temperature=(20, 32), humidity=(70, 95), rainfall=(180, 320),
    ),
    "Cardamom": dict(
        N=(70, 140),  P=(20, 50),  K=(40, 80),  ph=(5.0, 6.5),
        temperature=(15, 28), humidity=(70, 95), rainfall=(200, 350),
    ),
    "Clove": dict(
        N=(60, 120),  P=(20, 45),  K=(30, 65),  ph=(5.5, 7.0),
        temperature=(22, 32), humidity=(70, 90), rainfall=(180, 300),
    ),
    "Ginger": dict(
        N=(80, 150),  P=(30, 60),  K=(40, 80),  ph=(5.5, 7.0),
        temperature=(20, 32), humidity=(70, 90), rainfall=(150, 280),
    ),
    "Turmeric": dict(
        N=(80, 150),  P=(30, 60),  K=(40, 80),  ph=(5.5, 7.5),
        temperature=(20, 35), humidity=(65, 90), rainfall=(120, 250),
    ),
    "Garlic": dict(
        N=(50, 110),  P=(30, 60),  K=(30, 65),  ph=(6.0, 8.0),
        temperature=(10, 25), humidity=(40, 70), rainfall=(30, 80),
    ),
    "Coriander": dict(
        N=(30, 80),   P=(25, 55),  K=(25, 55),  ph=(6.0, 8.0),
        temperature=(15, 28), humidity=(40, 70), rainfall=(30, 80),
    ),
    "Cumin": dict(
        N=(25, 70),   P=(20, 50),  K=(20, 50),  ph=(7.0, 9.0),
        temperature=(20, 35), humidity=(30, 55), rainfall=(15, 50),
    ),

    # ---- Fruits ----
    "Mango": dict(
        N=(70, 145),  P=(30, 70),  K=(40, 80),  ph=(5.5, 7.5),
        temperature=(22, 45), humidity=(45, 82), rainfall=(50, 180),
    ),
    "Banana": dict(
        N=(90, 170),  P=(30, 65),  K=(60, 120), ph=(5.5, 7.5),
        temperature=(22, 38), humidity=(70, 95), rainfall=(120, 280),
    ),
    "Papaya": dict(
        N=(70, 140),  P=(25, 55),  K=(40, 80),  ph=(5.5, 7.0),
        temperature=(22, 38), humidity=(60, 90), rainfall=(100, 250),
    ),
    "Guava": dict(
        N=(50, 110),  P=(20, 50),  K=(30, 70),  ph=(5.5, 8.0),
        temperature=(20, 38), humidity=(45, 80), rainfall=(60, 180),
    ),
    "Pomegranate": dict(
        N=(40, 100),  P=(20, 50),  K=(30, 70),  ph=(6.5, 8.5),
        temperature=(22, 40), humidity=(30, 65), rainfall=(20, 80),
    ),
    "Grape": dict(
        N=(50, 110),  P=(25, 55),  K=(40, 80),  ph=(6.0, 8.0),
        temperature=(18, 38), humidity=(35, 70), rainfall=(20, 80),
    ),
    "Orange": dict(
        N=(60, 130),  P=(25, 55),  K=(35, 75),  ph=(5.5, 7.5),
        temperature=(18, 35), humidity=(50, 80), rainfall=(80, 200),
    ),
    "Watermelon": dict(
        N=(50, 110),  P=(25, 55),  K=(30, 70),  ph=(6.0, 7.5),
        temperature=(25, 42), humidity=(45, 75), rainfall=(30, 80),
    ),
    "Jackfruit": dict(
        N=(60, 120),  P=(20, 50),  K=(40, 80),  ph=(5.5, 7.5),
        temperature=(22, 38), humidity=(65, 90), rainfall=(120, 280),
    ),

    # ---- Vegetables ----
    "Tomato": dict(
        N=(70, 140),  P=(30, 65),  K=(40, 80),  ph=(5.5, 7.5),
        temperature=(18, 32), humidity=(50, 80), rainfall=(40, 120),
    ),
    "Onion": dict(
        N=(50, 110),  P=(30, 60),  K=(30, 65),  ph=(6.0, 8.0),
        temperature=(12, 28), humidity=(45, 75), rainfall=(30, 80),
    ),
    "Potato": dict(
        N=(80, 160),  P=(40, 80),  K=(50, 100), ph=(5.0, 7.0),
        temperature=(10, 25), humidity=(60, 85), rainfall=(50, 130),
    ),
    "Brinjal": dict(  # Eggplant
        N=(60, 130),  P=(30, 60),  K=(30, 65),  ph=(5.5, 7.5),
        temperature=(20, 35), humidity=(55, 85), rainfall=(50, 150),
    ),
    "Cabbage": dict(
        N=(70, 140),  P=(35, 70),  K=(40, 80),  ph=(6.0, 7.5),
        temperature=(10, 22), humidity=(60, 85), rainfall=(50, 100),
    ),
    "Cauliflower": dict(
        N=(70, 140),  P=(35, 70),  K=(40, 80),  ph=(6.0, 7.5),
        temperature=(10, 22), humidity=(60, 85), rainfall=(50, 100),
    ),
    "Okra": dict(      # Bhindi
        N=(50, 110),  P=(25, 55),  K=(25, 55),  ph=(6.0, 8.0),
        temperature=(24, 38), humidity=(55, 85), rainfall=(60, 150),
    ),
    "Chilli": dict(
        N=(60, 130),  P=(30, 60),  K=(30, 65),  ph=(5.5, 7.5),
        temperature=(20, 35), humidity=(55, 85), rainfall=(50, 120),
    ),
}


def _generate_dataset() -> pd.DataFrame:
    """
    Sample SAMPLES_PER_CROP rows per crop from the defined uniform ranges,
    then add small Gaussian noise to make the data more realistic.
    Also adds 10% of adversarial overlap-breaking samples per crop
    that sit at the centroid of each crop's ideal range.
    """
    rows = []
    for crop, profile in CROP_PROFILES.items():
        # Main samples with jitter
        for _ in range(SAMPLES_PER_CROP):
            row = {feat: float(RNG.uniform(lo, hi)) for feat, (lo, hi) in profile.items()}
            for feat in FEATURE_COLUMNS:
                row[feat] = max(0.0, row[feat] * (1 + RNG.normal(0, 0.04)))
            row[TARGET_COLUMN] = crop
            rows.append(row)
        # Centroid-biased samples (tighter around ideal center)
        n_center = SAMPLES_PER_CROP // 5
        for _ in range(n_center):
            row = {}
            for feat, (lo, hi) in profile.items():
                mid = (lo + hi) / 2
                spread = (hi - lo) / 6
                row[feat] = max(0.0, float(RNG.normal(mid, spread)))
            row[TARGET_COLUMN] = crop
            rows.append(row)
    return pd.DataFrame(rows)


def build_pipeline() -> Pipeline:
    return Pipeline([
        ("clf", RandomForestClassifier(
            n_estimators=40,
            max_depth=10,
            min_samples_split=8,
            min_samples_leaf=4,
            random_state=42,
            n_jobs=1,
            class_weight="balanced_subsample",
            max_features="sqrt",
        )),
    ])


def train(save: bool = True) -> Pipeline:
    print("Generating synthetic training dataset (50 crops) ...")
    df = _generate_dataset()
    print(f"  {len(df):,} samples across {df[TARGET_COLUMN].nunique()} crops.")

    X = df[FEATURE_COLUMNS].values
    y = df[TARGET_COLUMN].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y,
    )

    print("Training lightweight RandomForest pipeline (40 trees, tuned for free-tier memory) ...")
    pipe = build_pipeline()
    pipe.fit(X_train, y_train)

    y_pred = pipe.predict(X_test)
    report = classification_report(y_test, y_pred, output_dict=True)
    accuracy = report.get("accuracy", 0)
    print(f"  Test accuracy (top-1) : {accuracy:.3f}")

    # Top-3 accuracy (what farmers actually see)
    proba = pipe.predict_proba(X_test)
    top3_correct = 0
    classes = list(pipe.classes_)
    for i, true_label in enumerate(y_test):
        top3_idx = np.argsort(proba[i])[::-1][:3]
        if true_label in [classes[j] for j in top3_idx]:
            top3_correct += 1
    top3_acc = top3_correct / len(y_test)
    print(f"  Top-3 accuracy        : {top3_acc:.3f}")

    # Show per-crop scores
    macro_f1 = report.get("macro avg", {}).get("f1-score", 0)
    weighted_f1 = report.get("weighted avg", {}).get("f1-score", 0)
    print(f"  Macro F1      : {macro_f1:.3f}")
    print(f"  Weighted F1   : {weighted_f1:.3f}")
    print(f"  Classes       : {len(pipe.classes_)}")

    if save:
        OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
        # Compression keeps artifact small enough for low-memory cold starts.
        joblib.dump(pipe, str(OUTPUT_PATH), compress=6)
        print(f"  Model saved   -> {OUTPUT_PATH}")
        REPORT_PATH.write_text(json.dumps(report, indent=2))
        print(f"  Report saved  -> {REPORT_PATH}")

    return pipe


if __name__ == "__main__":
    train()
