import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import pandas as pd
import json
import os
from model import NCFModel
from sklearn.model_selection import train_test_split

class InteractionDataset(Dataset):
    def __init__(self, user_indices, item_indices, labels):
        self.user_indices = torch.tensor(user_indices, dtype=torch.long)
        self.item_indices = torch.tensor(item_indices, dtype=torch.long)
        self.labels = torch.tensor(labels, dtype=torch.float32)

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        return self.user_indices[idx], self.item_indices[idx], self.labels[idx]

def train_ncf():
    # 1. Load data and mappings
    print("Loading data...")
    df = pd.read_csv('processed_interactions.csv')
    with open('mappings.json', 'r') as f:
        mappings = json.load(f)
    
    num_users = mappings['num_users']
    num_items = mappings['num_items']
    
    # 2. Split data
    train_df, val_df = train_test_split(df, test_size=0.1, random_state=42)
    
    train_dataset = InteractionDataset(train_df['user_idx'].values, train_df['item_idx'].values, train_df['label'].values)
    val_dataset = InteractionDataset(val_df['user_idx'].values, val_df['item_idx'].values, val_df['label'].values)
    
    train_loader = DataLoader(train_dataset, batch_size=1024, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=1024, shuffle=False)
    
    # 3. Init Model
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = NCFModel(num_users, num_items).to(device)
    
    criterion = nn.BCELoss() # Use Binary Cross Entropy for probability-like output
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    # 4. Training Loop
    epochs = 1 
    print(f"Starting training on {device} for {epochs} epochs...")
    
    for epoch in range(epochs):
        model.train()
        train_loss = 0
        for i, (users, items, labels) in enumerate(train_loader):
            users, items, labels = users.to(device), items.to(device), labels.to(device)
            
            optimizer.zero_grad()
            predictions = model(users, items)
            loss = criterion(predictions, labels)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            if (i + 1) % 500 == 0:
                print(f"Epoch {epoch+1}/{epochs}, Step {i+1}/{len(train_loader)}, Loss: {loss.item():.4f}")
        
        # Validation
        model.eval()
        val_loss = 0
        with torch.no_grad():
            for users, items, labels in val_loader:
                users, items, labels = users.to(device), items.to(device), labels.to(device)
                predictions = model(users, items)
                val_loss += criterion(predictions, labels).item()
        
        print(f"Epoch {epoch+1} complete. Avg Train Loss: {train_loss/len(train_loader):.4f}, Avg Val Loss: {val_loss/len(val_loader):.4f}")
    
    # 5. Save model
    torch.save(model.state_dict(), 'ncf_model.pth')
    print("Model saved to ncf_model.pth!")

if __name__ == "__main__":
    train_ncf()
