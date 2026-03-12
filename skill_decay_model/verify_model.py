import joblib
import pandas as pd
import numpy as np
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "skill_decay_model.joblib")

def verify_accuracy():
    if not os.path.exists(MODEL_PATH):
        print("Model file not found!")
        return

    model = joblib.load(MODEL_PATH)
    
    # Generate test cases to see how it predicts
    # Features: [days_since_last, prev_time_taken, difficulty, prev_outcome]
    test_cases = [
        {"days": 1, "time": 300, "diff": 1, "outcome": 1, "desc": "Easy Q, solved recently, last time correct"},
        {"days": 30, "time": 1200, "diff": 3, "outcome": 1, "desc": "Hard Q, solved 1 month ago, last time correct"},
        {"days": 2, "time": 600, "diff": 2, "outcome": 0, "desc": "Medium Q, failed recently"},
        {"days": 15, "time": 400, "diff": 1, "outcome": 1, "desc": "Easy Q, 2 weeks ago, last time correct"}
    ]
    
    df_test = pd.DataFrame([
        [tc["days"], tc["time"], tc["diff"], tc["outcome"]] for tc in test_cases
    ], columns=["days_since_last", "prev_time_taken", "difficulty", "prev_outcome"])
    
    probs = model.predict_proba(df_test)
    
    print("=== Skill Decay ML Model Verification ===")
    for i, tc in enumerate(test_cases):
        prob_success = probs[i][1]
        print(f"Scenario: {tc['desc']}")
        print(f"Predicted Probability of success today: {prob_success:.2%}\n")

if __name__ == "__main__":
    verify_accuracy()
