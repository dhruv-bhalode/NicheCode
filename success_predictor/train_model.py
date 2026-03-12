import json
import os
import pickle
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score, classification_report
from sklearn.utils import resample
from datetime import datetime

# --- Configuration ---
DATA_DIR = Path("./data")
AUGMENTED_DIR = Path(r"c:\VSCODE_CAPSTONE\Capstone_Phase2\data_augmented")
MODEL_DIR = Path(".")
MODEL_NAME = "success_predictor_model.pkl"

USERS_FILE = AUGMENTED_DIR / "correct_users.json"
INTERACTIONS_FILE = AUGMENTED_DIR / "correct_interactions.json"
PROBLEMS_FILE = DATA_DIR / "display-problems.json"

DIFFICULTY_MAP = {"Easy": 1, "Medium": 2, "Hard": 3}
EXPERIENCE_MAP = {"Beginner": 1, "Intermediate": 2, "Advanced": 3}

FEATURE_COLS = [
    "userRating",
    "accuracy",
    "solvedProblems",
    "experience",
    "skillMatch",
    "difficulty",
    "acceptanceRate",
    "timeTakenNorm",
    "recentSuccessRate",
    "difficultyGap"
]

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def compute_skill_match(skill_distribution, tags):
    if not skill_distribution or not tags:
        return 0.1
    skill_map = {s["name"]: s["level"] for s in skill_distribution if "name" in s and "level" in s}
    levels = [skill_map.get(tag, 0.0) for tag in tags]
    return float(np.mean(levels)) if levels else 0.1

def build_features(users, interactions, problems):
    user_lookup = {u["userId"]: u for u in users}
    problem_lookup = {p["id"]: p for p in problems}
    
    user_interactions = {}
    for ix in interactions:
        uid = ix.get("userId")
        if uid not in user_interactions:
            user_interactions[uid] = []
        user_interactions[uid].append(ix)
    
    for uid in user_interactions:
        user_interactions[uid].sort(key=lambda x: x.get("createdAt", ""), reverse=False) # Important: Chronological for historical features

    rows = []
    skipped = 0
    for ix in interactions:
        uid = ix.get("userId")
        pid = str(ix.get("problemId", ""))
        user = user_lookup.get(uid)
        prob = problem_lookup.get(pid)
        
        if not user or not prob:
            skipped += 1
            continue
            
        current_time = ix.get("createdAt", "")
        
        # Historical stats for THIS interaction (don't peek at future)
        past_ixs = [i for i in user_interactions.get(uid, []) if i.get("createdAt", "") < current_time]
        
        user_rating = user.get("userRating", 1200)
        solved_count = len([i for i in past_ixs if i.get("submissionStatus") == 1])
        total_count = len(past_ixs)
        historical_acc = solved_count / total_count if total_count > 0 else user.get("accuracy", 0.5)
        
        experience = EXPERIENCE_MAP.get(user.get("experience", "Beginner"), 1)
        skill_match = compute_skill_match(user.get("skillDistribution", []), prob.get("tags", []))
        diff_val = DIFFICULTY_MAP.get(prob.get("difficulty", "Medium"), 2)
        acceptance_rate = (prob.get("acceptanceRate") or 50.0) / 100.0
        
        # Recent 5 (moving window)
        recent_5 = past_ixs[-5:]
        avg_time = np.mean([i.get("timeTakenSeconds", 300) for i in recent_5]) if recent_5 else 300
        time_taken_norm = min(avg_time / 1200.0, 1.0)
        
        successes = sum([1 for i in recent_5 if i.get("submissionStatus") == 1])
        recent_success_rate = successes / len(recent_5) if recent_5 else historical_acc
        
        expected_rating = 1000 + (diff_val - 1) * 400
        difficulty_gap = user_rating - expected_rating
        
        rows.append({
            "userRating": user_rating,
            "accuracy": historical_acc,
            "solvedProblems": solved_count,
            "experience": experience,
            "skillMatch": skill_match,
            "difficulty": diff_val,
            "acceptanceRate": acceptance_rate,
            "timeTakenNorm": time_taken_norm,
            "recentSuccessRate": recent_success_rate,
            "difficultyGap": difficulty_gap,
            "label": 1 if ix.get("submissionStatus") == 1 else 0
        })
        
    print(f"Built {len(rows)} training rows. Skipped {skipped}.")
    return pd.DataFrame(rows)

def train():
    print("Loading data...")
    users = load_json(USERS_FILE)
    interactions = load_json(INTERACTIONS_FILE)
    problems = load_json(PROBLEMS_FILE)
    
    df = build_features(users, interactions, problems)
    
    X = df[FEATURE_COLS].values
    y = df["label"].values
    
    # Stratified CV for more reliable accuracy estimate on small data
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    model = Pipeline([
        ("scaler", StandardScaler()),
        ("rf", RandomForestClassifier(n_estimators=500, max_depth=8, class_weight="balanced", random_state=42))
    ])

    scores = cross_val_score(model, X, y, cv=skf, scoring='accuracy')
    print(f"\nCV Accuracy: {np.mean(scores):.4f} (+/- {np.std(scores):.4f})")

    # Final Train/Test Split for detailed report
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Balancing the training set
    X_train_0 = X_train[y_train == 0]
    X_train_1 = X_train[y_train == 1]
    if len(X_train_0) < len(X_train_1):
        X_train_0_resampled = resample(X_train_0, replace=True, n_samples=len(X_train_1), random_state=42)
        X_train = np.vstack((X_train_1, X_train_0_resampled))
        y_train = np.hstack((np.ones(len(X_train_1)), np.zeros(len(X_train_1))))

    model.fit(X_train, y_train)
    
    probs = model.predict_proba(X_test)[:, 1]
    preds = (probs >= 0.5).astype(int)
    
    acc = accuracy_score(y_test, preds)
    auc = roc_auc_score(y_test, probs)
    
    print(f"\n✅ Final Evaluation Results:")
    print(f"Accuracy: {acc:.4f}")
    print(f"ROC-AUC:  {auc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, preds))
    
    with open(MODEL_NAME, 'wb') as f:
        pickle.dump(model, f)
    
    print(f"Saved optimized model to {MODEL_NAME}")

if __name__ == "__main__":
    train()
