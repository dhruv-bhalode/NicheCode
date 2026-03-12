import json
import sys
import os
import math
from datetime import datetime, timezone
import joblib
import pandas as pd

# Load Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DISPLAY_PROBLEMS_PATH = os.path.join(BASE_DIR, "display-problems.json")
MODEL_PATH = os.path.join(BASE_DIR, "skill_decay_model.joblib")

# Multipliers & Constants (Matching skill_decay_model.py)
DEFAULT_STABILITY = 1.0
FAILURE_MULTIPLIER = 0.5
DIFFICULTY_MULTIPLIER = { "Easy": 1.5, "Medium": 2.0, "Hard": 2.5 }

def load_json(path):
    if not os.path.exists(path): return []
    with open(path, 'r', encoding='utf-8') as f: return json.load(f)

def parse_time(time_str):
    try:
        return datetime.fromisoformat(time_str.replace('Z', '+00:00'))
    except:
        return datetime.now(timezone.utc)

def calculate_stability_boost(difficulty, time_taken_seconds):
    base = DIFFICULTY_MULTIPLIER.get(difficulty, 1.5)
    benchmarks = {"Easy": 300, "Medium": 600, "Hard": 1200}
    benchmark = benchmarks.get(difficulty, 600)
    
    performance_boost = 1.0
    if time_taken_seconds > 0:
        ratio = time_taken_seconds / benchmark
        if ratio < 0.5: performance_boost = 1.2
        elif ratio < 1.0: performance_boost = 1.1
        elif ratio > 2.0: performance_boost = 0.9
            
    return base * performance_boost

def calculate_retention(last_review_time, stability, current_time, problem_id, last_time_taken, last_outcome, model=None, difficulty_val=2):
    if not last_review_time: return 1.0
    
    elapsed_days = (current_time - last_review_time).total_seconds() / 86400.0
    if elapsed_days < 0: elapsed_days = 0 
    
    # 1. Apply a "temporal penalty" for failures
    # If the user failed, we act as if more time has passed (decaying the curve)
    # This avoids hardcoding "0.1" while still logically dropping the score.
    effective_elapsed = elapsed_days
    if last_outcome == 0:
        # Penalty: Act as if 1 full stability period has already passed
        effective_elapsed += stability
    
    # 2. Force 1.0 retention for fresh SUCCESSFUL solves (within 1 hour)
    if last_outcome == 1 and elapsed_days < 0.0417: 
        return 1.0
 
    # 3. Pure Ebbinghaus Forgetting Curve: R = e^(-t/S)
    if stability <= 0: stability = 0.5
    return math.exp(-effective_elapsed / stability)

def main():
    try:
        # Read Input from Stdin
        input_data = json.load(sys.stdin)
        interactions = input_data.get("interactions", [])
        
        # Load Resources
        problems = load_json(DISPLAY_PROBLEMS_PATH)
        problem_map = { str(p.get("id") or p.get("_id")): p for p in problems }
        
        model = None
        if os.path.exists(MODEL_PATH):
            try:
                model = joblib.load(MODEL_PATH)
            except:
                pass

        # Process User History
        user_state = {}
        for interaction in interactions:
            problem_id = str(interaction.get("problemId"))
            problem_obj = problem_map.get(problem_id)
            difficulty = problem_obj.get("difficulty", "Medium") if problem_obj else "Medium"
            
            is_correct = interaction.get("submissionStatus") == 1
            time_taken = interaction.get("timeTakenSeconds", 0)
            timestamp = parse_time(interaction.get("createdAt"))
            
            # Update Stability Logic
            if problem_id not in user_state:
                if is_correct:
                    new_stability = DEFAULT_STABILITY * calculate_stability_boost(difficulty, time_taken)
                else:
                    new_stability = 0.5
            else:
                current_stability = user_state[problem_id]["stability"]
                if is_correct:
                    new_stability = current_stability * calculate_stability_boost(difficulty, time_taken)
                else:
                    new_stability = current_stability * FAILURE_MULTIPLIER
            
            user_state[problem_id] = {
                "stability": new_stability,
                "last_review": timestamp,
                "last_time_taken": time_taken,
                "last_outcome": 1 if is_correct else 0,
                "difficulty_val": {"Easy": 1, "Medium": 2, "Hard": 3}.get(difficulty, 2)
            }

        # Calculate Final Retention for Solved Problems
        results = {}
        current_time = datetime.now(timezone.utc)
        
        for problem_id, state in user_state.items():
            # Only care about confirmed solved problems (last outcome was correct) or at least attempted
            # But the requirement is specifically for "solved Qs"
            # We will return retention for everything, caller filters by `uniqueSolvedIds`
            
            retention = calculate_retention(
                state["last_review"],
                state["stability"],
                current_time,
                problem_id,
                state["last_time_taken"],
                state["last_outcome"],
                model,
                state["difficulty_val"]
            )
            results[problem_id] = retention

        print(json.dumps(results))

    except Exception as e:
        # Output empty JSON on error to prevent crash
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
