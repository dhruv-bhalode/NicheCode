import pickle
import numpy as np

def test():
    with open('complexity_predictor.pkl', 'rb') as f:
        m = pickle.load(f)
    
    # Test a simple O(n) loop
    code = "def solve(n): \n    for i in range(n): \n        print(i)"
    # Combined text as per training: code + tags + difficulty + desc
    text = code + " " + "array" + " " + "Easy" + " " + "Print numbers"
    
    X = m['vectorizer'].transform([text])
    # TRY TO PREDICT
    print("Predicting...")
    t_idx = m['model_time'].predict(X)[0]
    s_idx = m['model_space'].predict(X)[0]
    
    p_t = m['le_time'].inverse_transform([t_idx])[0]
    p_s = m['le_space'].inverse_transform([s_idx])[0]
    
    print(f"Code: {code}")
    print(f"Predicted Time: {p_t}")
    print(f"Predicted Space: {p_s}")

if __name__ == "__main__":
    test()
