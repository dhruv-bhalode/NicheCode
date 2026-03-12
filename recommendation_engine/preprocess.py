import pymongo
import pandas as pd
import json
import os
from dotenv import load_dotenv

# Load environment variables from server/.env
load_dotenv(dotenv_path='../server/.env')

MONGO_URI = os.getenv('MONGO_URI')
DB_NAME = 'capstone'

# Paths to augmented data
INTERACTIONS_PATH = '../data_augmented/correct_interactions.json'
USERS_PATH = '../data_augmented/correct_users.json'

def preprocess_data():
    print("Loading augmented users...")
    with open(USERS_PATH, 'r') as f:
        aug_users = json.load(f)
    aug_user_ids = [u['userId'] for u in aug_users]
    
    print("Loading augmented interactions (this may take a few seconds)...")
    with open(INTERACTIONS_PATH, 'r') as f:
        aug_interactions = json.load(f)
    interactions_df = pd.DataFrame(aug_interactions)
    
    # 1. Connect to MongoDB for Problems
    print("Connecting to MongoDB for problem metadata...")
    client = pymongo.MongoClient(MONGO_URI)
    db = client[DB_NAME]
    problems_col = db['display-problems']
    problems_data = list(problems_col.find({}, {'id': 1}))
    all_problem_ids = [p['id'] for p in problems_data]
    
    # 2. Harmonize Users
    # Also fetch existing live users from MongoDB just in case they aren't in augmented data
    print("Fetching live users for complete mapping...")
    live_users_col = db['users']
    live_user_ids = [u['userId'] for u in live_users_col.find({}, {'userId': 1}) if 'userId' in u]
    
    # Combine and create mappings
    all_unique_user_ids = list(set(aug_user_ids + live_user_ids + interactions_df['userId'].unique().tolist()))
    user_to_idx = {user_id: i for i, user_id in enumerate(all_unique_user_ids)}
    
    # Problems mapping (using all problems in collection)
    problem_to_idx = {prob_id: i for i, prob_id in enumerate(all_problem_ids)}
    
    # 3. Map for Training
    print("Mapping interaction IDs to indices...")
    interactions_df['user_idx'] = interactions_df['userId'].map(user_to_idx)
    interactions_df['item_idx'] = interactions_df['problemId'].map(problem_to_idx)
    
    # Drop records that can't be mapped (e.g. unknown problemId)
    original_len = len(interactions_df)
    interactions_df = interactions_df.dropna(subset=['user_idx', 'item_idx'])
    if len(interactions_df) < original_len:
        print(f"Dropped {original_len - len(interactions_df)} records due to missing ID mappings.")
        
    interactions_df['user_idx'] = interactions_df['user_idx'].astype(int)
    interactions_df['item_idx'] = interactions_df['item_idx'].astype(int)
    
    # Label: 1 for Solved, 0.5 for Attempted
    interactions_df['label'] = interactions_df['submissionStatus'].apply(lambda x: 1.0 if x == 1 else 0.5)
    
    # 4. Save processed training data
    print(f"Saving {len(interactions_df)} interactions to CSV...")
    interactions_df[['user_idx', 'item_idx', 'label']].to_csv('processed_interactions.csv', index=False)
    
    # 5. Save mappings for inference
    print("Saving mappings...")
    mappings = {
        'user_to_idx': user_to_idx,
        'idx_to_user': {v: k for k, v in user_to_idx.items()},
        'problem_to_idx': problem_to_idx,
        'idx_to_problem': {v: k for k, v in problem_to_idx.items()},
        'num_users': len(all_unique_user_ids),
        'num_items': len(all_problem_ids)
    }
    
    with open('mappings.json', 'w') as f:
        json.dump(mappings, f)
    
    print("Preprocessing complete!")

if __name__ == "__main__":
    preprocess_data()
