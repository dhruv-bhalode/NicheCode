import os
import joblib
import pickle
import numpy as np
import sklearn

model_path = r'c:\VSCODE_CAPSTONE\Capstone_Phase2\complexity_predictor\complexity_predictor.pkl'

print(f"NumPy version: {np.__version__}")
print(f"sklearn version: {sklearn.__version__}")

if not os.path.exists(model_path):
    print(f"Error: {model_path} not found")
else:
    model = None
    try:
        print(f"Attempting to load with joblib...")
        model = joblib.load(model_path)
        print("Model loaded successfully with joblib!")
    except Exception as e1:
        print(f"Joblib load failed: {e1}")
        try:
            print("Attempting to load with pickle...")
            with open(model_path, 'rb') as f:
                model = pickle.load(f)
            print("Model loaded successfully with pickle!")
        except Exception as e2:
            print(f"Pickle load failed: {e2}")

    if model:
        print(f"Model type: {type(model)}")
        if hasattr(model, 'feature_names_in_'):
            print(f"Features: {model.feature_names_in_}")
        elif hasattr(model, 'n_features_in_'):
            print(f"Number of features: {model.n_features_in_}")
        
        # Check for pipeline steps
        if hasattr(model, 'steps'):
            print(f"Pipeline steps: {[step[0] for step in model.steps]}")
            
        # Try to see if it's a classifier or regressor
        if hasattr(model, 'classes_'):
            print(f"Classes: {model.classes_}")
        
        # If it's a TfidfVectorizer or CountVectorizer, check it
        if hasattr(model, 'vocabulary_'):
            print(f"Vocabulary size: {len(model.vocabulary_)}")
    else:
        print("Failed to load model.")
