#!/usr/bin/env python
"""
Build script for production deployment on Render.
Trains the ML model before starting the application.
Run this in build step before pip install.
"""

import sys
import subprocess
import os
from pathlib import Path


def ensure_training_dependencies(repo_root: Path) -> int:
    """Install backend dependencies required for ML training."""
    req_file = repo_root / "apps" / "api" / "requirements.txt"
    print("[0/2] Ensuring training dependencies are installed...")
    result = subprocess.run(
        [sys.executable, "-m", "pip", "install", "-r", str(req_file)],
        cwd=str(repo_root),
        capture_output=True,
        text=True,
        timeout=600,
    )
    if result.returncode != 0:
        print("ERROR while installing dependencies:")
        print(result.stderr)
        return 1
    print("Dependencies ready.")
    return 0

def main():
    repo_root = Path(__file__).parent
    ml_dir = repo_root / "ml"

    skip_training = os.getenv("SKIP_MODEL_TRAINING", "").strip().lower() in {"1", "true", "yes", "on"}
    
    print("="*60)
    print("ML MODEL TRAINING FOR PRODUCTION")
    print("="*60)
    print()
    
    # Change to repo root
    sys.path.insert(0, str(repo_root))
    
    try:
        if skip_training:
            print("SKIP_MODEL_TRAINING is enabled. Skipping model training for low-memory deployment.")
            print("API will use the built-in rule-based fallback.")
            return 0

        dep_status = ensure_training_dependencies(repo_root)
        if dep_status != 0:
            return dep_status

        print("[1/2] Training lightweight ML model (free-tier safe profile)...")
        # Run training script
        result = subprocess.run(
            [sys.executable, str(ml_dir / "scripts" / "train.py")],
            cwd=str(repo_root),
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        if result.returncode != 0:
            print("ERROR during training:")
            print(result.stderr)
            return 1
        
        print(result.stdout)
        print("[2/2] Model trained successfully!")
        print()
        print("Model location: apps/api/ml_artifacts/model.joblib")
        print("Ready for deployment!")
        return 0
        
    except subprocess.TimeoutExpired:
        print("ERROR: Training timed out (> 5 minutes)")
        return 1
    except Exception as e:
        print(f"ERROR: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
