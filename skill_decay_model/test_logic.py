import math
import pandas as pd
import json
from datetime import datetime, timedelta, timezone
import os
import sys

# Add current dir to path to import calculate_retention
sys.path.append(os.getcwd())
from calculate_retention import calculate_retention

def test_logic():
    current_time = datetime.now(timezone.utc)
    
    # Test cases
    scenarios = [
        {
            "name": "Freshly Solved (1 min ago)",
            "last_review": current_time - timedelta(minutes=1),
            "stability": 2.0,
            "outcome": 1
        },
        {
            "name": "Solved 1 Month ago",
            "last_review": current_time - timedelta(days=30),
            "stability": 2.0,
            "outcome": 1
        }
    ]
    
    import joblib
    MODEL_PATH = "skill_decay_model.joblib"
    model = joblib.load(MODEL_PATH) if os.path.exists(MODEL_PATH) else None
    
    print("=== Hybrid Retention Logic Test (with ML) ===")
    for s in scenarios:
        ret = calculate_retention(
            s["last_review"],
            s["stability"],
            current_time,
            "test_id",
            300,
            s["outcome"],
            model=model
        )
        print(f"{s['name']}: Retention={ret:.4f} (Score={-ret:.4f})")

if __name__ == "__main__":
    test_logic()
