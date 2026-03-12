import json
import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib
from datetime import datetime

# ==========================================
# 1. LOAD DATA
# ==========================================
print("Loading data...")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INTERACTIONS_PATH = os.path.join(BASE_DIR, "interactions.json")
PROBLEMS_PATH = os.path.join(BASE_DIR, "display-problems.json")

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

interactions = load_json(INTERACTIONS_PATH)
problems = load_json(PROBLEMS_PATH)

# Map problem difficulty
difficulty_map = {str(p.get("id") or p.get("_id")): p.get("difficulty", "Medium") for p in problems}
difficulty_score = {"Easy": 1, "Medium": 2, "Hard": 3}

# ==========================================
# 2. FEATURE ENGINEERING
# ==========================================
print("Feature Engineering...")

# Convert to DataFrame
df = pd.DataFrame(interactions)
df['createdAt'] = pd.to_datetime(df['createdAt'].str.replace('Z', '+00:00'))

# Sort by user and time
df = df.sort_values(['userId', 'problemId', 'createdAt'])

# Features to build
data = []

# Group by User + Problem to find history
grouped = df.groupby(['userId', 'problemId'])

for (user, problem), group in grouped:
    group = group.sort_values('createdAt')
    
    # We need at least one past attempt to predict the NEXT one
    # So we iterate from the 2nd attempt onwards
    for i in range(1, len(group)):
        current_attempt = group.iloc[i]
        prev_attempt = group.iloc[i-1]
        
        # Target: Did they get it right THIS time?
        # submissionStatus 1 = Accepted/Correct, 0 = Wrong
        is_correct = 1 if current_attempt.get("submissionStatus") == 1 else 0
        
        # Feature 1: Days since last attempt
        time_diff = (current_attempt['createdAt'] - prev_attempt['createdAt']).total_seconds() / 86400.0
        
        # Feature 2: Time taken in previous attempt
        prev_time_taken = prev_attempt.get("timeTakenSeconds", 0)
        
        # Feature 3: Difficulty
        diff_str = difficulty_map.get(str(problem), "Medium")
        diff_val = difficulty_score.get(diff_str, 2)
        
        # Feature 4: Previous Outcome (Did they get it right last time?)
        prev_outcome = 1 if prev_attempt.get("submissionStatus") == 1 else 0
        
        data.append({
            "days_since_last": time_diff,
            "prev_time_taken": prev_time_taken,
            "difficulty": diff_val,
            "prev_outcome": prev_outcome,
            "target": is_correct
        })

if not data:
    print("Not enough repeated interactions to train a model! (Need users to solve same problem twice)")
    # Fallback: Generate dummy data for demonstration if real data is insufficient
    print("Generating synthetic data for demonstration...")
    for _ in range(200):
        days = np.random.randint(1, 30)
        diff = np.random.randint(1, 4)
        prev_time = np.random.randint(60, 1200)
        prev_out = np.random.choice([0, 1])
        
        # Synthetic logic: Harder + Long gap = Fail
        prob_success = 0.9 - (days * 0.02) - (diff * 0.1) + (prev_out * 0.2)
        target = 1 if np.random.random() < prob_success else 0
        
        data.append({
            "days_since_last": days,
            "prev_time_taken": prev_time,
            "difficulty": diff,
            "prev_outcome": prev_out,
            "target": target
        })

model_df = pd.DataFrame(data)

# ==========================================
# 3. TRAIN MODEL
# ==========================================
print(f"Training on {len(model_df)} samples...")

X = model_df[["days_since_last", "prev_time_taken", "difficulty", "prev_outcome"]]
y = model_df["target"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# RandomForestClassifier
clf = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
clf.fit(X_train, y_train)

# Evaluate
y_pred = clf.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"\nModel Accuracy: {acc:.2f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# ==========================================
# 4. EXPLAINABILITY (For Viva)
# ==========================================
print("\n=== Feature Importance (What matters most?) ===")
importances = clf.feature_importances_
features = X.columns
for f, imp in zip(features, importances):
    print(f"{f}: {imp:.4f}")

# ==========================================
# 5. SAVE MODEL
# ==========================================
joblib.dump(clf, "skill_decay_model.joblib")
print("\nModel saved to 'skill_decay_model.joblib'")
