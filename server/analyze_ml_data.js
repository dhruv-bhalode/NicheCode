import json
import pandas as pd
import numpy as np
from pathlib import Path

DATA_DIR = Path("../success_predictor/data")
USERS_FILE = DATA_DIR / "users.json"
INTERACTIONS_FILE = DATA_DIR / "interactions.json"
PROBLEMS_FILE = DATA_DIR / "display-problems.json"

def load_json(path):
with open(path, 'r', encoding = 'utf-8') as f:
return json.load(f)

def analyze():
print("Loading data for analysis...")
users = load_json(USERS_FILE)
interactions = load_json(INTERACTIONS_FILE)
problems = load_json(PROBLEMS_FILE)

user_lookup = { u["userId"]: u for u in users }
problem_lookup = { p["id"]: p for p in problems }

rows = []
for ix in interactions:
    uid = ix.get("userId")
pid = str(ix.get("problemId", ""))
user = user_lookup.get(uid)
prob = problem_lookup.get(pid)
if not user or not prob: continue

rows.append({
    "userRating": user.get("userRating", 1200),
    "accuracy": user.get("accuracy", 0.5),
    "solvedProblems": user.get("solvedProblems", 0),
    "difficulty": prob.get("difficulty", "Medium"),
    "acceptanceRate": (prob.get("acceptanceRate") or 50.0),
    "label": 1 if ix.get("submissionStatus") == 1 else 0
        })

df = pd.DataFrame(rows)
print(f"\nTotal Samples: {len(df)}")
print(f"Class Balance: \n{df['label'].value_counts(normalize=True)}")

print("\nAccuracy by Difficulty:")
print(df.groupby('difficulty')['label'].mean())

print("\nCorrelation with Success:")
numeric_df = df.select_dtypes(include = [np.number])
print(numeric_df.corr()['label'].sort_values(ascending = False))

if __name__ == "__main__":
    analyze()
