import ast
import re

class CodeFeatureExtractor:
    def __init__(self, all_feature_names):
        self.feature_names = all_feature_names
        self.tag_features = [f for f in all_feature_names if f.startswith('tag_')]
        self.has_features = [f for f in all_feature_names if f.startswith('has_')]

    def extract(self, code, problem_metadata=None):
        features = {name: 0 for name in self.feature_names}
        
        # 1. Basic Code Metrics
        lines = code.splitlines()
        features['code_lines'] = len(lines)
        features['code_chars'] = len(code)
        features['avg_line_length'] = features['code_chars'] / max(1, features['code_lines'])
        
        # 2. Structural Metrics
        # Generalized loop detection
        features['for_loops'] = len(re.findall(r'\bfor\b', code))
        features['while_loops'] = len(re.findall(r'\bwhile\b', code))
        features['total_loops'] = features['for_loops'] + features['while_loops']
        
        # Generalized function detection (Python 'def', C++/Java 'returnType name(')
        python_funcs = re.findall(r'\bdef\s+(\w+)', code)
        typed_funcs = re.findall(r'\b(?:public|private|static|void|int|bool|double|float|long|vector|String|List)\s+(\w+)\s*\(', code)
        func_names = list(set(python_funcs + typed_funcs))
        features['num_functions'] = len(func_names)
        
        # Max indentation and nesting depth
        indent_levels = [len(line) - len(line.lstrip()) for line in lines if line.strip()]
        features['max_indent'] = max(indent_levels) if indent_levels else 0
        
        # Improved nesting depth estimation (count opens and closes)
        nesting = 0
        max_nesting = 0
        for char in code:
            if char in '{:': # Simplified for Python and C++/Java
                nesting += 1
                max_nesting = max(max_nesting, nesting)
            elif char == '}':
                nesting = max(0, nesting - 1)
        features['max_nesting'] = max_nesting
        
        # 3. "has_" features (Heuristics)
        features['has_1d_array'] = 1 if re.search(r'\[.*\]|\bvector\b|\bList\b', code) else 0
        features['has_2d_array'] = 1 if re.search(r'\[.*\[.*\]|\bvector<vector\b', code) else 0
        
        # Recursion check: function name called within code
        has_rec = 0
        for name in func_names:
            # Look for function name followed by ( but not the definition itself
            if len(re.findall(r'\b' + re.escape(name) + r'\s*\(', code)) > 1:
                has_rec = 1
                break
        features['has_recursion'] = has_rec
        
        features['has_dict'] = 1 if any(kw in code for kw in ['{', 'dict', 'map', 'Map', 'HashMap', 'unordered_map']) else 0
        features['has_set'] = 1 if any(kw in code for kw in ['set', 'Set', 'HashSet']) else 0
        features['has_stack'] = 1 if any(kw in code for kw in ['stack', 'Stack', '.pop()']) else 0
        features['has_queue'] = 1 if any(kw in code for kw in ['queue', 'Queue', 'deque']) else 0
        features['has_heap'] = 1 if any(kw in code for kw in ['heap', 'PriorityQueue', 'priority_queue']) else 0
        features['has_binary_search'] = 1 if any(kw in code for kw in ['bisect', 'binarySearch', 'low', 'high', 'mid']) and 'while' in code else 0
        features['has_bit_ops'] = 1 if any(op in code for op in ['<<', '>>', '&', '|', '^', '~']) else 0
        features['has_memoization'] = 1 if any(kw in code for kw in ['memo', 'cache', 'lru_cache', 'DP']) else 0
        features['has_sort'] = 1 if any(kw in code for kw in ['sort', 'sorted', 'Arrays.sort']) else 0
        features['has_string_ops'] = 1 if any(kw in code for kw in ['String', 'string', 'str', '.join', '.split']) else 0
        
        # 4. Metadata Features
        if problem_metadata:
            features['acceptance_rate'] = float(problem_metadata.get('acceptanceRate', 50.0))
            features['frequency'] = float(problem_metadata.get('frequency', 0.0))
            
            diff_map = {"Easy": 1, "Medium": 2, "Hard": 3}
            features['difficulty'] = diff_map.get(problem_metadata.get('difficulty', 'Medium'), 2)
            
            tags = problem_metadata.get('tags', [])
            features['num_tags'] = len(tags)
            for tag in tags:
                tag_feat = f"tag_{tag}"
                if tag_feat in features:
                    features[tag_feat] = 1

        return features
