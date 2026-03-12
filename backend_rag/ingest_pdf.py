import os
import glob
from typing import List
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv

load_dotenv()

# --- Config ---
PDF_DIRECTORY = "data_pdfs"  # Create this folder and put your PDFs there
CHROMA_PATH = "chroma_db"
EMBEDDING_MODEL = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")

def ingest_pdfs():
    """Ingest all PDFs from the specified directory into Chroma DB"""
    if not os.path.exists(PDF_DIRECTORY):
        os.makedirs(PDF_DIRECTORY)
        print(f"Created directory: {PDF_DIRECTORY}. Please add your PDFs there and run again.")
        return

    pdf_files = glob.glob(os.path.join(PDF_DIRECTORY, "*.pdf"))
    if not pdf_files:
        print(f"No PDF files found in {PDF_DIRECTORY}")
        return

    print(f"Found {len(pdf_files)} PDF files. Starting ingestion...")

    documents = []
    for pdf_path in pdf_files:
        print(f"Loading {pdf_path}...")
        loader = PyPDFLoader(pdf_path)
        documents.extend(loader.load())

    # Split documents into chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        add_start_index=True
    )
    chunks = text_splitter.split_documents(documents)
    print(f"Split into {len(chunks)} chunks.")

    # Create/Update Vector Store
    print("Saving to Chroma DB...")
    db = Chroma.from_documents(
        chunks, 
        EMBEDDING_MODEL, 
        persist_directory=CHROMA_PATH
    )
    print("✅ Ingestion complete! New data added to RAG knowledge base.")

if __name__ == "__main__":
    ingest_pdfs()
