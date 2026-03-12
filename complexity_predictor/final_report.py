import json
import pickle
import pandas as pd
import random
import os

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

def run_final_report():
    print("--- Complexity Predictor Accuracy & Generalization Report ---")
    
    with open('complexity_predictor.pkl', 'rb') as f:
        m = pickle.load(f)

    # 1. DATABASE ACCURACY
    data_path = r'c:\VSCODE_CAPSTONE\Capstone_Phase2\server\complexity_test_data.json'
    with open(data_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    valid_data = [p for p in data if p.get('optimalSolution') and p.get('optimalTimeComplexity')]
    random.shuffle(valid_data)
    subset = valid_data[:100]
    
    correct_t = 0
    correct_s = 0
    
    for p in subset:
        gt_t = normalize_complexity(p['optimalTimeComplexity'])
        gt_s = normalize_complexity(p['optimalSpaceComplexity'])
        text = str(p['optimalSolution']) + " " + " ".join(p.get('tags', [])) + " " + str(p.get('difficulty', 'Medium'))
        
        try:
            X = m['vectorizer'].transform([text])
            t_idx = m['model_time'].predict(X)[0]
            s_idx = m['model_space'].predict(X)[0]
            p_t = m['le_time'].inverse_transform([t_idx])[0]
            p_s = m['le_space'].inverse_transform([s_idx])[0]
            if p_t == gt_t: correct_t += 1
            if p_s == gt_s: correct_s += 1
        except: pass

    # 2. CROSS-LANGUAGE
    test_cases = [
        {"lang": "Python", "name": "Basic Loop", "code": "def f(arr): \n  for x in arr: print(x)", "exp": "O(n)/O(1)"},
        {"lang": "Java", "name": "Binary Search", "code": "int s(int[] a, int t) {\n  int l=0, r=a.length-1;\n  while(l<=r) { ... }\n}", "exp": "O(log n)/O(1)"},
        {"lang": "C++", "name": "Standard Sort", "code": "void s(vector<int>& v) { sort(v.begin(), v.end()); }", "exp": "O(n log n)/O(1)"}
    ]
    
    weird_code = "def weird_search(v): return v[0]"
    X_w = m['vectorizer'].transform([weird_code])
    p_t_w = m['le_time'].inverse_transform(m['model_time'].predict(X_w))[0]

    results_path = 'final_accuracy_results.txt'
    with open(results_path, 'w') as f_out:
        f_out.write(f"Database Accuracy (100 Samples):\nTime: {correct_t}%, Space: {correct_s}%\n\n")
        f_out.write("Multi-Language Generalization:\n")
        for tc in test_cases:
            X = m['vectorizer'].transform([tc['code']])
            t_idx = m['model_time'].predict(X)[0]
            s_idx = m['model_space'].predict(X)[0]
            p_t = m['le_time'].inverse_transform([t_idx])[0].replace('²', '^2')
            p_s = m['le_space'].inverse_transform([s_idx])[0].replace('²', '^2')
            f_out.write(f"[{tc['lang']}] {tc['name']}: Pred {p_t}/{p_s} (Exp {tc['exp']})\n")
        f_out.write(f"\nGeneralization check: {p_t_w}\n")
    print("Done.")

if __name__ == "__main__":
    run_final_report()
