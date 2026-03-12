import json
import os
import time
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document
from dotenv import load_dotenv

load_dotenv()

# Use Absolute Path to avoid CWD issues
try:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
except NameError:
    BASE_DIR = os.path.dirname(os.path.abspath("backend_rag/ingest_problems.py"))

# New dataset location
DATA_PATH = r"C:\VSCODE_CAPSTONE\Capstone_Phase2\server\exports\display-problems.json"
CHROMA_PATH = os.path.join(BASE_DIR, "chroma_db_problems")

def ingest():
    if not os.path.exists(DATA_PATH):
        print(f"File not found: {DATA_PATH}")
        return

    # Check for API Key
    if not os.environ.get("GOOGLE_API_KEY"):
        print("Error: GOOGLE_API_KEY not found in environment variables.")
        return

    print(f"Loading data from {DATA_PATH}...")
    try:
        with open(DATA_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading JSON: {e}")
        return

    documents = []
    print(f"Processing {len(data)} problems from display-problems.json...")
    
    for i, item in enumerate(data):
        # Extract fields based on rules
        problem_id = str(item.get("id", ""))
        title = item.get("title", "")
        method_name = item.get("methodName", "")
        tags = item.get("tags", [])
        companies = item.get("companies", [])
        description = item.get("description", "")
        difficulty = item.get("difficulty", "Unknown")
        acceptance_rate = item.get("acceptanceRate", "Unknown")
        frequency = item.get("frequency", "Unknown")
        
        # Format QAs from mcqs array
        mcqs = item.get("mcqs", [])
        qa_text = ""
        for mcq in mcqs:
            q = mcq.get("question", "")
            ans_idx = mcq.get("correctAnswer", -1)
            options = mcq.get("options", [])
            
            options_str = "\n".join([f"Option {idx}: {opt}" for idx, opt in enumerate(options)])
            
            a = options[ans_idx] if 0 <= ans_idx < len(options) else ""
            expl = mcq.get("explanation", "")
            category = mcq.get("category", "")
            if q:
                qa_text += f"\nMCQ Category: {category}\nMCQ Question: {q}\nOptions:\n{options_str}\nCorrect Answer Index: {ans_idx}\nCorrect Answer Text: {a}\nExplanation: {expl}\n"
                
        explanation_field = item.get("explanation", "") # if present at root
        hints = item.get("hints", [])
        
        test_cases = item.get("testCases", [])
        test_cases_text = ""
        for tc in test_cases:
             test_cases_text += f"- Input: {tc.get('input', '')} | Output: {tc.get('output', '')}\n"
             
        constraints = item.get("constraints", [])
        
        optimal_solution = item.get("optimalSolution", "")
        
        # Complexities
        bf_time = item.get("bruteForceTimeComplexity", "")
        bf_space = item.get("bruteForceSpaceComplexity", "")
        opt_time = item.get("optimalTimeComplexity", "")
        opt_space = item.get("optimalSpaceComplexity", "")

        # Removed nl formatting, using simple join correctly
        hints_formatted = '\n'.join(f"- {h}" for h in hints) if hints else 'None'
        constraints_formatted = '\n'.join(f"- {c}" for c in constraints) if constraints else 'None'

        # Format into a single, structured document content for retrieval
        page_content = f"""
        Problem ID: {problem_id}
        Title: {title}
        Method Name: {method_name}
        Tags: {', '.join(tags)}
        Companies: {', '.join(companies)}
        Difficulty: {difficulty}
        Acceptance Rate: {acceptance_rate}%
        Frequency: {frequency}
        
        Description:
        {description}
        
        Hints:
        {hints_formatted}
        
        Related Q&A / MCQs:
        {qa_text}
        
        Additional Explanation: {explanation_field}
        
        Test Cases:
        {test_cases_text}
        
        Constraints:
        {constraints_formatted}
        
        Optimal Solution Code:
        ```
        {optimal_solution}
        ```
        
        Complexities:
        - Brute Force Time Complexity: {bf_time}
        - Brute Force Space Complexity: {bf_space}
        - Optimal Time Complexity: {opt_time}
        - Optimal Space Complexity: {opt_space}
        """

        doc = Document(
            page_content=page_content,
            metadata={
                "source": "display-problems.json",
                "id": problem_id,
                "title": title,
                "tags": ', '.join(tags)[:2000], # Trim to avoid metadata size issues
                "companies": ', '.join(companies)[:2000]
            }
        )
        documents.append(doc)

    print(f"Creating embeddings for {len(documents)} documents using Local HuggingFace (all-mpnet-base-v2)...")
    
    embedding_function = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-mpnet-base-v2",
        model_kwargs={'device': 'cpu'},
        encode_kwargs={'normalize_embeddings': True}
    )
    
    # Check existing data to resume safely without using quotas on duplicates
    db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_function)
    try:
        existing_data = db.get()
        existing_ids = set()
        if existing_data and 'metadatas' in existing_data and existing_data['metadatas']:
            for meta in existing_data['metadatas']:
                 if meta and 'id' in meta:
                      existing_ids.add(str(meta['id']))
        
        docs_to_ingest = [doc for doc in documents if str(doc.metadata['id']) not in existing_ids]
        print(f"Found {len(existing_ids)} existing documents in {CHROMA_PATH}.")
        if len(documents) - len(docs_to_ingest) > 0:
             print(f"Skipping {len(documents) - len(docs_to_ingest)} documents that are already embedded.")
             
    except Exception as e:
        print(f"Could not read existing DB, starting fresh or appending blindly: {e}")
        docs_to_ingest = documents

    if not docs_to_ingest:
        print("All documents are already ingested! Nothing to do.")
        return

    documents = docs_to_ingest

    # Ingest in larger batches since HuggingFace allows more
    batch_size = 50
    total_batches = (len(documents) + batch_size - 1) // batch_size
    
    print(f"Starting ingestion of {len(documents)} NEW documents into {CHROMA_PATH} in {total_batches} batches...")

    for i in range(0, len(documents), batch_size):
        batch = documents[i:i + batch_size]
        batch_num = i // batch_size + 1
        print(f"Ingesting batch {batch_num}/{total_batches} ({len(batch)} docs)...")
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Ingest exact batch without hitting old IDs
                db.add_documents(documents=batch)
                print("Batch success, resting 2s to not overwhelm HuggingFace API...")
                time.sleep(2) 
                break # Success, move to next batch
            except Exception as e:
                print(f"Error ingesting batch {batch_num} (Attempt {attempt+1}): {e}")
                time.sleep(5)
        else:
            print(f"Failed to ingest batch {batch_num} after retries. Skipping.")
    
    print("Ingestion complete!")

if __name__ == "__main__":
    ingest()
