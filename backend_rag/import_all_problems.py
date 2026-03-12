import json
import os
import time
import requests
from leetcode_service import LeetCodeService

def generate_mcqs(title, description):
    # Deterministic generation based on problem content
    import hashlib
    
    # Create a seed from the title to ensure consistent "random" questions for the same problem
    seed = int(hashlib.sha256(title.encode('utf-8')).hexdigest(), 16)
    
    # Generic templates for questions
    complexity_options_time = ["O(n)", "O(n log n)", "O(n²)", "O(1)"]
    complexity_options_space = ["O(n)", "O(1)", "O(log n)", "O(n²)"]
    
    # Shift options based on seed
    shift = seed % 4
    opts_time = complexity_options_time[shift:] + complexity_options_time[:shift]
    opts_space = complexity_options_space[shift:] + complexity_options_space[:shift]
    
    # Determine "correct" answer index (mock logic)
    correct_time = (seed % 4)
    correct_space = ((seed >> 2) % 4)
    
    questions = [
        {
            "id": f"{hash(title)}-1",
            "question": f"What is the expected time complexity for the optimal solution to '{title}'?",
            "options": opts_time,
            "correctAnswer": correct_time,
            "explanation": f"For '{title}', the optimal approach typically achieves {opts_time[correct_time]}.",
            "category": "algorithm"
        },
        {
            "id": f"{hash(title)}-2",
            "question": f"Which data structure is most critical for solving '{title}' efficiently?",
            "options": ["Hash Map", "Stack", "Queue", "Heap / Priority Queue"],
            "correctAnswer": (seed >> 4) % 4,
            "explanation": "Choosing the right data structure is often the key to meeting the time complexity constraints.",
            "category": "data-structure"
        }
    ]
    return questions

def generate_ts_file(problems_data, output_path):
    print(f"Generating {output_path} with {len(problems_data)} problems...")
    
    ts_content = """
export interface TestCase {
    input: string;
    output: string;
    explanation?: string;
}

export interface MCQQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    category: 'data-structure' | 'algorithm' | 'approach';
}

export interface Problem {
    id: string;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    description: string;
    inputFormat: string;
    outputFormat: string;
    constraints: string[];
    testCases: TestCase[];
    tags: string[];
    hints: string[];
    optimalSolution: string;
    timeComplexity?: string;
    spaceComplexity?: string;
    template: string;
    templates?: { [key: string]: string };
    methodName: string;
    mcqs: MCQQuestion[];
    acceptanceRate?: number;
    frequency?: number;
    companies?: string[];
}

export const problems: Problem[] = [
"""
    
    for i, p in enumerate(problems_data):
        # Helper to format string literals for TS
        def clean_str(s):
            if not s: return ""
            # Escape backticks and ${} for template literals
            return s.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")

        test_cases_str = "[\n" + ",\n".join([
            f"            {{ input: `{clean_str(tc.get('input', ''))}`, output: `{clean_str(tc.get('output', ''))}`, explanation: `{clean_str(tc.get('explanation', ''))}` }}"
            for tc in p.get('testCases', [])
        ]) + "\n        ]"

        constraints_str = "[" + ", ".join([f"`{clean_str(c)}`" for c in p.get('constraints', [])]) + "]"
        tags_str = json.dumps(p.get('tags', []))
        hints_str = json.dumps(p.get('hints', []))
        companies_str = json.dumps(p.get('companies', []))
        mcqs_str = json.dumps(p.get('mcqs', []))
        
        # Templates
        templates_obj = p.get('templates', {})
        templates_str = "{\n"
        for lang, code in templates_obj.items():
            templates_str += f"            {lang}: `{clean_str(code)}`,\n"
        templates_str += "        }"

        ts_content += f"""    {{
        id: '{p.get('id')}',
        title: `{clean_str(p.get('title'))}`,
        difficulty: '{p.get('difficulty').title() if p.get('difficulty') else 'Medium'}',
        description: `{clean_str(p.get('description'))}`,
        inputFormat: `{clean_str(p.get('inputFormat'))}`,
        outputFormat: `{clean_str(p.get('outputFormat'))}`,
        constraints: {constraints_str},
        testCases: {test_cases_str},
        tags: {tags_str},
        hints: {hints_str},
        optimalSolution: `{clean_str(p.get('optimalSolution'))}`,
        template: `{clean_str(p.get('template'))}`,
        templates: {templates_str},
        methodName: '{p.get('methodName')}',
        acceptanceRate: {p.get('acceptanceRate', 0)},
        frequency: {p.get('frequency', 0)},
        companies: {companies_str},
        mcqs: {mcqs_str}
    }},
"""

    ts_content += "];\n"
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(ts_content)
    print("Done!")

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    json_path = os.path.join(base_dir, '..', 'leetcode-problems-dataset', 'raw_data', 'leetcode_problems.json')
    output_path = os.path.join(base_dir, 'src', 'data', 'problems.ts')
    
    print(f"Reading from {json_path}")
    with open(json_path, 'r', encoding='utf-8') as f:
        problems_metadata = json.load(f)
    
    service = LeetCodeService()
    final_problems = []
    
    print(f"Found {len(problems_metadata)} problems in JSON.")
    
    print(f"Processing ALL problems from local dataset...")
    
    for i, meta in enumerate(problems_metadata):
        # Local dataset has 'titleSlug' or 'slug'
        slug = meta.get('titleSlug') or meta.get('slug')
             
        if not slug:
            print(f"Skipping item {i} (No slug found)")
            continue

        if meta.get('paidOnly'):
            # print(f"Skipping Premium Problem: {meta.get('title')} ({slug})")
            continue

        try:
            # Check if we should fetch content
            # If local metadata has content, use it. Otherwise fetch.
            # We know local metadata usually lacks content based on previous checks.
            # So default to fetch.
            
            # Rate limit
            time.sleep(0.5) 
            
            print(f"Fetching [{i+1}/{len(problems_metadata)}] {meta.get('title', 'Unknown')} ({slug})...")
            details = service.fetch_problem_details(slug)
            
            if not details:
                print(f"Skipping {slug} (Not found from API)")
                continue

            # Transform
            app_problem = service.transform_to_app_format(details)
            
            # Enrich with JSON metadata
            app_problem['frequency'] = meta.get('frequency', 0)
            app_problem['acceptanceRate'] = meta.get('acceptanceRate', 0) or meta.get('acRate', 0) or meta.get('acceptance_rate', 0)
            app_problem['companies'] = meta.get('companies', [])
            
            # Generate MCQs
            app_problem['mcqs'] = generate_mcqs(app_problem['title'], app_problem['description'])
            
            # Ensure difficulty matches
            if 'difficulty' in meta:
                app_problem['difficulty'] = meta['difficulty']
            
            final_problems.append(app_problem)
            
            if i % 50 == 0:
                print(f"Processed {i} problems... (Saved {len(final_problems)})")
            
        except Exception as e:
            # Silently skip errors or print minimal warning
            # print(f"Skipping {slug} due to error: {e}")
            continue
            
    # Generate TS file
    generate_ts_file(final_problems, output_path)

if __name__ == "__main__":
    main()
