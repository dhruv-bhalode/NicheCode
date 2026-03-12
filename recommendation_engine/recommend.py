import torch
import json
import pymongo
import os
import sys
from dotenv import load_dotenv
from model import NCFModel

# Load environment variables
load_dotenv(dotenv_path='../server/.env')

MONGO_URI = os.getenv('MONGO_URI')
DB_NAME = 'capstone'

def get_recommendations(user_id, top_k=10):
    # 1. Load mappings and model
    try:
        with open('mappings.json', 'r') as f:
            mappings = json.load(f)
        
        num_users = mappings['num_users']
        num_items = mappings['num_items']
        user_to_idx = mappings['user_to_idx']
        idx_to_problem = mappings['idx_to_problem']
        
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        model = NCFModel(num_users, num_items)
        model.load_state_dict(torch.load('ncf_model.pth', map_location=device))
        model.to(device)
        model.eval()
    except Exception as e:
        print(f"Error loading model/mappings: {e}", file=sys.stderr)
        return []

    # 2. Connect to MongoDB to get user state
    client = pymongo.MongoClient(MONGO_URI)
    db = client[DB_NAME]
    user_col = db['users']
    problems_col = db['display-problems']
    
    user_data = user_col.find_one({'userId': user_id})
    if not user_data:
        print(f"User {user_id} not found in MongoDB.", file=sys.stderr)
        # Fallback: Return top problems by frequency
        top_probs = list(problems_col.find().sort('frequency', -1).limit(top_k))
        return [p['id'] for p in top_probs]

    solved_ids = user_data.get('uniqueSolvedIds', [])
    
    # 3. Handle Cold Start or Known User
    if user_id in user_to_idx:
        u_idx = user_to_idx[user_id]
        
        # Candidate generation: Problems not solved yet
        all_prob_ids = list(mappings['problem_to_idx'].keys())
        candidates = [p for p in all_prob_ids if p not in solved_ids]
        
        if not candidates:
            return []
            
        candidate_indices = [mappings['problem_to_idx'][p] for p in candidates]
        
        # Inference
        user_tensor = torch.full((len(candidate_indices),), u_idx, dtype=torch.long).to(device)
        item_tensor = torch.tensor(candidate_indices, dtype=torch.long).to(device)
        
        with torch.no_grad():
            scores = model(user_tensor, item_tensor)
            
        # Rank
        results = {c: float(s) for c, s in zip(candidates, scores.tolist())}
        return results
    else:
        # User not in training set - use skill matching fallback
        print(f"User {user_id} is new to the model. Using skill-based recommendations.", file=sys.stderr)
        # Simpler fallback: problems with tags matching user's top skills
        skills = user_data.get('skillDistribution', [])
        top_skills = sorted(skills, key=lambda x: x['level'], reverse=True)[:3]
        skill_names = [s['name'] for s in top_skills]
        
        query = {
            'id': {'$nin': solved_ids},
            'tags': {'$in': skill_names}
        }
        fallback_probs = list(problems_col.find(query).sort('frequency', -1).limit(100))
        # Assign decoy scores from 0.8 downwards
        results = {p['id']: 0.8 - (i * 0.001) for i, p in enumerate(fallback_probs)}
        return results

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python recommend.py <userId>")
        sys.exit(1)
        
    user_id = sys.argv[1]
    recs = get_recommendations(user_id)
    print(json.dumps(recs))
