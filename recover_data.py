import re
import os

input_path = 'src/data/problems.ts'
output_path = 'temp_extract.js'

print(f"Reading {input_path}...")
with open(input_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Robust header stripping:
if 'export const problems' in content:
    content = 'global.problems' + content.split('export const problems')[1]
    # Remove type annotation : Problem[] =
    content = re.sub(r':\s*Problem\[\]\s*=', ' =', content, count=1)
else:
    print("Error: 'export const problems' not found!")
    exit(1)

# 3. Replace None with null, but preserve assignments like next=None
# We use negative lookbehind for =
# Also handle "val=None" or " = None"
# Regex: (?<=[^=])\bNone\b matches None not preceded by =
# But lookbehind must be fixed width.
# So (?<!=)\bNone\b checks strictly for = immediately before N.
# If " = None" (space), it matches (and replaces). This is good for "key: None".
# But "next = None" (assignment with space) would be replaced -> "next = null". Invalid Python.
# We want to preserve specific Python patterns?
# "next=None", "val=None", "return None".
# "return None" is OK to change to "return null" (comment/text).
# "next = None" is code.
# Ideally we only replace `key: None` or `[None]` or `None,`.
# Regex: `(?<=[:\[,])\s*None\b` ?
# Matches None preceded by colon, bracket, or comma (with optional space).
# This catches `key: None`, `[None]`, `val, None`.
# It misses `func(None)`.
# But `ReferenceError` usually comes from valid JS identifier positions.
# In JS object: `key: value`. Value starts after colon.
# So `(?<=:)\s*None\b` should catch the culprit!
# Let's try that first since it's safest.

# 3. Aggressive global replacement of None -> null
# This might break "next=None" in Python templates, but it's necessary to fix ReferenceError.
# We can try to preserve "next=None" but "return None" must become "return null" if unquoted.
# Actually, let's just do it. It's safer for data extraction.
content = re.sub(r'\bNone\b', 'null', content)

# 4. Write to temp CJS (flushed to disk)
# Ensure we use .cjs to avoid "require is not defined" in ESM environment
output_path = 'temp_extract.cjs'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(content)
    f.write('\n\nconst fs = require("fs");\n')
    f.write('const path = require("path");\n')
    f.write('const publicDir = "public";\n')
    f.write('if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);\n')
    f.write('fs.writeFileSync("public/problems.json", JSON.stringify(global.problems, null, 2));\n')

print(f"Created {output_path}. Now run: node {output_path}")
