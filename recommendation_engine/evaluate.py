import torch
import pandas as pd
import json
import numpy as np
from model import NCFModel
from sklearn.model_selection import train_test_split

def evaluate_model():
    # 1. Load data and mappings
    print("Loading data for evaluation...")
    df = pd.read_csv('processed_interactions.csv')
    with open('mappings.json', 'r') as f:
        mappings = json.load(f)
    
    num_users = mappings['num_users']
    num_items = mappings['num_items']
    
    # 2. Get validation set (same split as training)
    _, val_df = train_test_split(df, test_size=0.1, random_state=42)
    
    # Filter only "Positive" interactions (label 1.0) for Hit Rate calculation
    pos_val_df = val_df[val_df['label'] == 1.0].head(1000) # Sample for speed
    
    if pos_val_df.empty:
        print("No positive interactions in validation set to test Hit Rate.")
        return

    # 3. Load Model
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = NCFModel(num_users, num_items)
    model.load_state_dict(torch.load('ncf_model.pth', map_location=device))
    model.to(device)
    model.eval()
    
    hits = 0
    ndcgs = 0
    total = len(pos_val_df)
    
    print(f"Evaluating {total} positive samples...")
    
    for _, row in pos_val_df.iterrows():
        u_idx = int(row['user_idx'])
        i_idx = int(row['item_idx'])
        
        # Candidate generation for this user: 100 random items + the target item
        random_items = np.random.choice(num_items, 99, replace=False).tolist()
        item_indices = [i_idx] + random_items
        
        user_tensor = torch.full((100,), u_idx, dtype=torch.long).to(device)
        item_tensor = torch.tensor(item_indices, dtype=torch.long).to(device)
        
        with torch.no_grad():
            predictions = model(user_tensor, item_tensor)
        
        # Get top 10
        _, top_indices = torch.topk(predictions, 10)
        top_items = [item_indices[idx] for idx in top_indices.tolist()]
        
        # Check if target item is in top 10
        if i_idx in top_items:
            hits += 1
            # Calculate NDCG
            rank = top_items.index(i_idx)
            ndcgs += np.log(2) / np.log(rank + 2)
            
    hit_rate = hits / total
    avg_ndcg = ndcgs / total
    
    print(f"Results:")
    print(f"Hit Rate @ 10: {hit_rate:.4f}")
    print(f"NDCG @ 10: {avg_ndcg:.4f}")

if __name__ == "__main__":
    evaluate_model()
