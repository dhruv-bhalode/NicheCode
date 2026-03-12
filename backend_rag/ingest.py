import json
import os
from langchain_community.vectorstores import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.documents import Document
from dotenv import load_dotenv

load_dotenv()


import os
# Use Absolute Path to avoid CWD issues
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(os.path.dirname(BASE_DIR), "answers_fixed.json")
CHROMA_PATH = os.path.join(BASE_DIR, "chroma_db")

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
    print(f"Processing {len(data)} problems...")
    
    print(f"Processing {len(data)} items from answers_fixed.json...")
    
    for i, item in enumerate(data):
        # Handle answers_fixed.json structure (Context + QAs)
        context = item.get("context", "")
        qas = item.get("qas", [])
        
        # Format Q&A into text for better retrieval
        qa_text = ""
        for qa in qas:
            q = qa.get("question", "")
            # Extract first answer if available
            answers = qa.get("answers", [])
            a = answers[0].get("text", "") if answers else ""
            if q and a:
                qa_text += f"\nQ: {q}\nA: {a}\n"

        # Create document content
        page_content = f"Context:\n{context}\n\nRelated Q&A:{qa_text}"
        
        doc = Document(
            page_content=page_content,
            metadata={
                "source": "answers_fixed.json",
                "id": f"doc_{i}",
                "preview": context[:50]
            }
        )
        documents.append(doc)

    print(f"Creating embeddings for {len(documents)} documents using Google Gemini (001)...")
    # Use models/gemini-embedding-001 (Available but rate limited - handled by loop)
    embedding_function = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    

    import time

    # Ingest in VERY small batches to avoid rate limits
    batch_size = 5
    total_batches = (len(documents) + batch_size - 1) // batch_size
    
    print(f"Starting ingestion of {len(documents)} documents in {total_batches} batches...")

    for i in range(0, len(documents), batch_size):
        batch = documents[i:i + batch_size]
        batch_num = i // batch_size + 1
        print(f"Ingesting batch {batch_num}/{total_batches} ({len(batch)} docs)...")
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                db = Chroma.from_documents(
                    documents=batch,
                    embedding=embedding_function,
                    persist_directory=CHROMA_PATH
                )
                # Sleep heavily to respect rate limits
                print("Sleeping 10s to respect API limits...")
                time.sleep(10) 
                break # Success, move to next batch
            except Exception as e:
                print(f"Error ingesting batch {batch_num} (Attempt {attempt+1}): {e}")
                if "429" in str(e) or "Resource exhausted" in str(e):
                    print("Hit Rate Limit. Sleeping 60s...")
                    time.sleep(60)
                else:
                    time.sleep(5)
        else:
            print(f"Failed to ingest batch {batch_num} after retries. Skipping.")
    
    print("Ingestion complete!")

if __name__ == "__main__":
    ingest()
