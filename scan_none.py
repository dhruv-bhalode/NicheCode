import re

def scan_file(filepath):
    print(f"Scanning {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Simple state machine
    in_backtick = False
    in_double = False
    in_single = False
    
    lines = content.split('\n')
    
    for line_idx, line in enumerate(lines):
        # We process char by char to handle state (simplified)
        # This is not a perfect parser but should catch "None" outside strings
        # Caveat: Multiline backticks.
        # We need to process the WHOLE content as a stream to track backticks properly.
        pass

    # Stream processing
    for i, char in enumerate(content):
        if char == '`' and not in_double and not in_single:
            in_backtick = not in_backtick
        elif char == '"' and not in_backtick and not in_single:
            in_double = not in_double
        elif char == "'" and not in_backtick and not in_double:
            in_single = not in_single
        
        # Check for None
        if not in_backtick and not in_double and not in_single:
            # Look ahead for "None"
            if content[i:i+4] == 'None':
                # Check boundaries (word)
                prev_char = content[i-1] if i > 0 else ' '
                next_char = content[i+4] if i+4 < len(content) else ' '
                if not prev_char.isalnum() and not next_char.isalnum() and prev_char != '_' and next_char != '_':
                    # Found unquoted None!
                    # Find line number
                    line_num = content[:i].count('\n') + 1
                    # Extract line content
                    line_start = content.rfind('\n', 0, i) + 1
                    line_end = content.find('\n', i)
                    line_text = content[line_start:line_end]
                    print(f"Found unquoted None at Line {line_num}:")
                    print(line_text.strip())
                    print("-" * 20)
                    
scan_file('src/data/problems.ts')
