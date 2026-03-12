import re

with open('executor.py', 'r') as f:
    content = f.read()

f_strings = re.findall(r'f"""(.*?)"""', content, re.DOTALL)
for i, fs in enumerate(f_strings):
    print(f"--- F-STRING {i} ---")
    # Find single {
    singles_left = re.findall(r'(?<!{){(?!{)', fs)
    # Find single }
    singles_right = re.findall(r'(?<!})}(?!})', fs)
    
    if singles_left:
        print("Single { found!")
        # For each match, print some context
        for m in re.finditer(r'(?<!{){(?!{)', fs):
            start = max(0, m.start() - 40)
            end = min(len(fs), m.end() + 40)
            print(f"Context: ...{fs[start:end]}...")
            
    if singles_right:
        print("Single } found!")
        # For each match, print some context
        for m in re.finditer(r'(?<!})}(?!})', fs):
            start = max(0, m.start() - 40)
            end = min(len(fs), m.end() + 40)
            print(f"Context: ...{fs[start:end]}...")
