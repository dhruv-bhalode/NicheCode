import json
import re

json_path = r'c:\VSCODE_CAPSTONE\leetcode-problems-dataset\raw_data\leetcode_problems.json'

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

count = 0
complexity_found = 0

for item in data:
    count += 1
    solution = item.get('solution')
    if solution:
        if 'Time complexity' in solution or 'Space complexity' in solution:
            complexity_found += 1

print(f"Total problems in JSON: {count}")
print(f"Problems with complexity info: {complexity_found}")
