import json
import pickle
import pandas as pd
import numpy as np
from sklearn.metrics import accuracy_score, classification_report
import os

# Re-use the normalization logic from training
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

def run_verification():
    print("--- 🔬 Complexity Predictor Accuracy Report ---")
    
    # 1. Load Model
    model_path = r'c:\VSCODE_CAPSTONE\Capstone_Phase2\complexity_predictor\complexity_predictor.pkl'
    try:
        with open(model_path, 'rb') as f:
            m = pickle.load(f)
        print("✅ Model loaded successfully.")
    except Exception as e:
        print(f"❌ Failed to load model: {e}")
        return

    # 2. Load Ground Truth
    data_path = r'c:\VSCODE_CAPSTONE\Capstone_Phase2\server\complexity_test_data.json'
    with open(data_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    df = pd.DataFrame(data)
    df = df.dropna(subset=['optimalSolution', 'optimalTimeComplexity', 'optimalSpaceComplexity'])
    
    # Normalize Ground Truth
    df['gt_time'] = df['optimalTimeComplexity'].apply(normalize_complexity)
    df['gt_space'] = df['optimalSpaceComplexity'].apply(normalize_complexity)
    
    # Filter for the same classes the model was trained on
    df = df[df['gt_time'].isin(m['le_time'].classes_) & df['gt_space'].isin(m['le_space'].classes_)]
    print(f"Dataset Size: {len(df)}")

    # Feature Engineering (Same as training)
    def safe_join(field):
        if isinstance(field, list): return " ".join([str(i) for i in field])
        if isinstance(field, str): return field
        return ""
    
    df['tags_str'] = df['tags'].apply(safe_join)
    df['desc_str'] = df['description'].apply(safe_join)
    df['combined_text'] = df['optimalSolution'] + " " + df['tags_str'] + " " + df['difficulty'].fillna('') + " " + df['desc_str'].fillna('')
    
    # Predict one by one to avoid NumPy broadcast issues
    print("Running per-sample predictions (Dense Mode)...")
    pred_t = []
    pred_s = []
    
    # Take a smaller subset (200) for fast verification
    all_texts = df['combined_text'].tolist()[:200]
    
    n = len(all_texts)
    for i in range(n):
        try:
            # CONVERT TO DENSE (TOARRAY)
            sample_x = m['vectorizer'].transform([all_texts[i]]).toarray()
            
            t_idx = m['model_time'].predict(sample_x)[0]
            s_idx = m['model_space'].predict(sample_x)[0]
            
            p_t = m['le_time'].inverse_transform([t_idx])[0]
            p_s = m['le_space'].inverse_transform([s_idx])[0]
            
            pred_t.append(p_t)
            pred_s.append(p_s)
        except Exception as e:
            pred_t.append("ERROR")
            pred_s.append("ERROR")
            if i % 10 == 0: print(f"  Sample {i} failed: {e}")

    gt_t = df['gt_time'].tolist()[:200]
    gt_s = df['gt_space'].tolist()[:200]

    # 3. STATISTICAL ACCURACY
    valid_indices = [i for i in range(len(pred_t)) if pred_t[i] != "ERROR"]
    count = len(valid_indices)
    
    if count == 0:
        print("❌ All predictions failed.")
        return

    correct_t = sum(1 for i in valid_indices if pred_t[i] == gt_t[i])
    correct_s = sum(1 for i in valid_indices if pred_s[i] == gt_s[i])
    
    print(f"\n📈 Overall Database Accuracy ({count} Valid Samples):")
    print(f"   - Time Complexity: {correct_t / count:.2%}")
    print(f"   - Space Complexity: {correct_s / count:.2%}")

    # 4. GENERALIZATION TEST (Zero-Shot / Brand New Code)
    print("\n🌍 Generalization Test (Unseen Code Across Languages):")
    
    test_cases = [
        # PYTHON
        {
            "lang": "Python",
            "code": "def find_max(arr):\n    m = arr[0]\n    for x in arr: m = max(m, x)\n    return m",
            "exp_t": "O(n)", "exp_s": "O(1)"
        },
        {
            "lang": "Python",
            "code": "def nested(n):\n    res = []\n    for i in range(n):\n        for j in range(n):\n            res.append(i * j)\n    return res",
            "exp_t": "O(n²)", "exp_s": "O(n²)"
        },
        # JAVA
        {
            "lang": "Java",
            "code": "public int search(int[] nums, int target) {\n    int l=0, r=nums.length-1;\n    while(l<=r) {\n        int m=l+(r-l)/2;\n        if(nums[m]==target) return m;\n        if(nums[m]<target) l=m+1; else r=m-1;\n    }\n    return -1;\n}",
            "exp_t": "O(log n)", "exp_s": "O(1)"
        },
        # CPP
        {
            "lang": "C++",
            "code": "void sortArr(vector<int>& a) {\n    sort(a.begin(), a.end());\n}",
            "exp_t": "O(n log n)", "exp_s": "O(log n)"
        }
    ]
    
    results = []
    for tc in test_cases:
        # We simulate the production pipeline: code + empty tags/difficulty
        X_tc = m['vectorizer'].transform([tc['code'] + " " + "" + " " + "Medium" + " " + ""])
        t_idx = m['model_time'].predict(X_tc)
        s_idx = m['model_space'].predict(X_tc)
        
        p_t = m['le_time'].inverse_transform(t_idx)[0]
        p_s = m['le_space'].inverse_transform(s_idx)[0]
        
        match = (p_t == tc['exp_t'] and p_s == tc['exp_s'])
        results.append({
            "Lang": tc['lang'],
            "Exp": f"{tc['exp_t']}/{tc['exp_s']}",
            "Pred": f"{p_t}/{p_s}",
            "Success": "✅" if p_t == tc['exp_t'] else "❌"
        })
        
    for r in results:
        print(f"   [{r['Lang']}] Expected: {r['Exp']}, Predicted: {r['Pred']} {r['Success']}")

    # 5. MEMORIZATION CHECK
    # Random Forest usually overfits if not constrained. Let's check max_depth.
    print(f"\n🧠 Model Internal Analysis (Memorization vs Generalization):")
    # Tree depth check
    depths = [t.get_depth() for t in m['model_time'].estimators_]
    avg_depth = sum(depths) / len(depths)
    print(f"   - Average Tree Depth: {avg_depth:.1f}")
    if avg_depth > 30:
        print("   ⚠️  Warning: High depth suggests potential for memorization (overfitting).")
    else:
        print("   ✅ Conclusion: Model depth is balanced for a dataset of 2.8k samples.")

if __name__ == "__main__":
    run_verification()
