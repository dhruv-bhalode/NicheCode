import json
import pandas as pd
import numpy as np
import pickle
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.multioutput import MultiOutputClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.preprocessing import LabelEncoder

def normalize_complexity(c):
    if not isinstance(c, str): return "O(1)"
    c = c.strip().replace('^', '').replace('²', '2').replace('³', '3')
    c = c.replace(' ', '').lower()
    mapping = {
        'o(n)': 'O(n)', 'o(nlogn)': 'O(n log n)', 'o(logn)': 'O(log n)',
        'o(1)': 'O(1)', 'o(n2)': 'O(n²)', 'o(m*n)': 'O(m*n)',
        'o(n+m)': 'O(n+m)', 'o(v+e)': 'O(V+E)', 'o(m+n)': 'O(n+m)',
        'o(n*m)': 'O(m*n)', 'o(h)': 'O(h)', 'o(v)': 'O(V)',
        'o(k)': 'O(k)', 'o(nlogk)': 'O(n log k)', 'o(2n)': 'O(2^n)'
    }
    return mapping.get(c, c.capitalize())

def train():
    print("Loading exported complexity data...")
    with open('../server/complexity_data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    df = pd.DataFrame(data)
    
    # 1. DROP ALL NULLS FIRST
    df = df.dropna(subset=['optimalSolution', 'optimalTimeComplexity', 'optimalSpaceComplexity'])
    df['optimalSolution'] = df['optimalSolution'].astype(str)
    df = df[df['optimalSolution'].str.strip() != ""]
    
    # 2. Normalize
    df['y_time'] = df['optimalTimeComplexity'].apply(normalize_complexity)
    df['y_space'] = df['optimalSpaceComplexity'].apply(normalize_complexity)
    
    # 3. Filter for labels with sufficient samples
    time_counts = df['y_time'].value_counts()
    valid_time = time_counts[time_counts >= 5].index
    
    space_counts = df['y_space'].value_counts()
    valid_space = space_counts[space_counts >= 5].index
    
    df = df[df['y_time'].isin(valid_time) & df['y_space'].isin(valid_space)]
    
    print(f"Final training records: {len(df)}")
    
    # 4. Feature Engineering
    def safe_join(field):
        if isinstance(field, list): return " ".join([str(i) for i in field])
        if isinstance(field, str): return field
        return ""
        
    df['tags_str'] = df['tags'].apply(safe_join)
    df['desc_str'] = df['description'].apply(safe_join)
    df['const_str'] = df['constraints'].apply(safe_join)
    
    df['combined_text'] = (
        df['optimalSolution'] + " " + 
        df['tags_str'] + " " + 
        df['difficulty'].fillna('') + " " +
        df['desc_str'] + " " +
        df['const_str']
    )
    
    vectorizer = TfidfVectorizer(max_features=4000, stop_words='english', ngram_range=(1, 2))
    X = vectorizer.fit_transform(df['combined_text'])
    
    le_time = LabelEncoder()
    y_time = le_time.fit_transform(df['y_time'])
    
    le_space = LabelEncoder()
    y_space = le_space.fit_transform(df['y_space'])
    
    print(f"Training Time Model ({len(le_time.classes_)} classes)...")
    model_time = RandomForestClassifier(n_estimators=100, random_state=42)
    model_time.fit(X, y_time)
    
    print(f"Training Space Model ({len(le_space.classes_)} classes)...")
    model_space = RandomForestClassifier(n_estimators=100, random_state=42)
    model_space.fit(X, y_space)
    
    # 5. Export
    model_data = {
        'model_time': model_time,
        'model_space': model_space,
        'vectorizer': vectorizer,
        'le_time': le_time,
        'le_space': le_space
    }
    
    with open('complexity_predictor.pkl', 'wb') as f:
        pickle.dump(model_data, f)
    
    print("\n✅ Successfully created compatible complexity_predictor.pkl")

if __name__ == "__main__":
    train()
