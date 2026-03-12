import json
import numpy as np

def analyze_fields(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    all_topics = set()
    other_fields = set()
    
    for item in data:
        topics_list = item.get('topicTags') or item.get('topics')
        if topics_list:
            all_topics.update(topics_list)
            
        for key in item.keys():
            if key not in ['topicTags', 'topics', 'description', 'title', 'id', 'optimalSolution', 'solution']:
                other_fields.add(key)
                
    print(f"Total Unique Topics: {len(all_topics)}")
    print(f"Other Metadata Fields: {len(other_fields)}")
    print(f"Other Fields: {sorted(list(other_fields))}")
    print(f"Total: {len(all_topics) + len(other_fields)}")

if __name__ == "__main__":
    path = r'c:\VSCODE_CAPSTONE\leetcode-problems-dataset\raw_data\leetcode_problems.json'
    analyze_fields(path)
