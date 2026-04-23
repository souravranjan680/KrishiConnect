"""
Quick sanity-check script: runs a single prediction through the rule-based stub
(or the trained model if it exists) and prints the result.

Usage (from repo root):
    cd d:\CRS
    python ml\scripts\test_inference.py
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "apps" / "api"))

from app.ml.inference import InputFeatures, predict_top_n  # noqa: E402

features = InputFeatures(
    N=80, P=40, K=35, ph=6.8,
    temperature=25.0, humidity=65.0, rainfall=120.0,
)

predictions = predict_top_n(features, n=3)

print("Top 3 crop predictions:")
for i, p in enumerate(predictions, 1):
    print(f"  {i}. {p.crop:<15} confidence={p.probability * 100:.1f}%")
