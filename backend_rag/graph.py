import os
from typing import Dict, TypedDict
from langchain_community.vectorstores import Chroma
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv

import chromadb
chromadb.config.Settings(anonymized_telemetry=False)
import chromadb.telemetry
chromadb.telemetry.DISABLE_TELEMETRY = True

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Load env explicitly from backend_rag/.env
env_path = os.path.join(BASE_DIR, ".env")
load_dotenv(dotenv_path=env_path)
# Use Absolute Path to avoid CWD issues
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CHROMA_PATH = os.path.join(BASE_DIR, "chroma_db_problems")

# Use HuggingFace all-mpnet-base-v2 (768 dim) — MUST match the model used during retraining
from langchain_huggingface import HuggingFaceEmbeddings
EMBEDDING_MODEL = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-mpnet-base-v2",
    model_kwargs={'device': 'cpu'},
    encode_kwargs={'normalize_embeddings': True}
)

# --- State ---
class GraphState(TypedDict):
    question: str
    chat_history: list
    context: str
    answer: str

# --- Nodes ---
def retrieve(state: GraphState):
    print("---RETRIEVE---")
    question_orig = state["question"]
    chat_history = state.get("chat_history", [])
    
    print(f"Current Question: {question_orig}")
    print(f"History Length: {len(chat_history)}")

    # CONTEXT ENRICHMENT: If the question is short/vague (e.g. "give me hints"), 
    # look at history to see if a problem was being discussed.
    enriched_query = question_orig
    if len(question_orig.split()) < 5 and chat_history:
        recent_context = ""
        # Look back at last few messages for problem titles or IDs
        for msg in reversed(chat_history[-4:]):
            recent_context += " " + msg.get("content", "")
        enriched_query = f"{question_orig} {recent_context}".strip()
        print(f"Enriched Query for retrieval: {enriched_query}")

    question = enriched_query.lower()

    try:
        db = Chroma(persist_directory=CHROMA_PATH, embedding_function=EMBEDDING_MODEL)
        import re

        documents = []

        # RULE 1: IDENTIFY REQUEST BY ID --- Exact ID lookup
        # Only trigger if specific ID keywords are present to avoid matching constraint numbers
        id_match = re.search(r'(?:problem|no\.?|id|#)\s*(\d+)\b', question)

        if id_match:
            target_id = id_match.group(1)
            print(f"ID lookup: {target_id}")
            # Use Langchain's Chroma filter capability properly
            try:
                # filter matches metadata directly
                raw_docs = db.similarity_search(enriched_query, k=5, filter={"id": target_id})
                if raw_docs:
                    documents.extend(raw_docs)
            except Exception as e:
                print(f"ID filter issue: {e}")

        # RULE 1 & 4: IDENTIFY REQUEST BY TAGS OR COMPANIES --- Keyword mapping
        if not documents:
            tag_keywords = set()
            company_keywords = set()
            try:
                all_data = db._collection.get(include=["metadatas"])
                for meta in all_data.get("metadatas", []):
                    if meta.get("tags"):
                        tag_keywords.update([t.strip().lower() for t in meta["tags"].split(",")])
                    if meta.get("companies"):
                        company_keywords.update([c.strip().lower() for c in meta["companies"].split(",")])
            except Exception as e:
                print(f"Error fetching metadata for tags/companies: {e}")

            matched_tags = [t for t in tag_keywords if t and re.search(r'\b' + re.escape(t) + r'\b', question)]
            matched_companies = [c for c in company_keywords if c and re.search(r'\b' + re.escape(c) + r'\b', question)]

            if matched_tags or matched_companies:
                print(f"Tag lookup: {matched_tags}, Company lookup: {matched_companies}")
                matching_meta_ids = []
                try:
                    all_metas = all_data.get("metadatas", [])
                    for meta in all_metas:
                        meta_id = meta.get("id")
                        if not meta_id:
                            continue
                        
                        doc_tags = meta.get("tags", "").lower() if meta.get("tags") else ""
                        doc_companies = meta.get("companies", "").lower() if meta.get("companies") else ""
                        
                        has_tag_match = any(t in doc_tags for t in matched_tags) if matched_tags else True
                        has_comp_match = any(c in doc_companies for c in matched_companies) if matched_companies else True
                        
                        if has_tag_match and has_comp_match:
                            matching_meta_ids.append(str(meta_id))
                            
                    # Fallback to union if intersection is empty
                    if not matching_meta_ids and matched_tags and matched_companies:
                        for meta in all_metas:
                            meta_id = meta.get("id")
                            if not meta_id:
                                continue
                            doc_tags = meta.get("tags", "").lower() if meta.get("tags") else ""
                            doc_companies = meta.get("companies", "").lower() if meta.get("companies") else ""
                            if any(t in doc_tags for t in matched_tags) or any(c in doc_companies for c in matched_companies):
                                matching_meta_ids.append(str(meta_id))
                                
                except Exception as e:
                    print(f"Error filtering ids locally: {e}")

                if matching_meta_ids:
                    try:
                        # Limit to avoid massive $in clauses
                        search_ids = matching_meta_ids[:50]
                        raw_docs = db.similarity_search(
                            question_orig, 
                            k=5, 
                            filter={"id": {"$in": search_ids}}
                        )
                        for d in raw_docs:
                            if d not in documents:
                                documents.append(d)
                    except Exception as e:
                        print(f"Filter $in failed: {e}")
                        # Fallback
                        for pid in matching_meta_ids[:5]:
                            docs = db.similarity_search(question_orig, k=1, filter={"id": pid})
                            for d in docs:
                                if d not in documents:
                                    documents.append(d)
                
                documents = documents[:5]

        # RULE 4: IDENTIFY REQUEST BY TITLE / METHOD NAME (Exact Memory Match)
        if not documents:
            import string
            def clean_text(text):
                return text.translate(str.maketrans('', '', string.punctuation)).lower()
                
            clean_q = clean_text(enriched_query)
            try:
                all_data = db._collection.get(include=["metadatas"])
                metadatas = all_data["metadatas"]
                doc_ids = all_data["ids"]
                
                # Sort indices by title length descending to match longest specific titles first (e.g. "Two Sum II" before "Two Sum")
                sorted_meta_idx = sorted(range(len(metadatas)), key=lambda x: len(metadatas[x].get("title", "")), reverse=True)
                
                for idx in sorted_meta_idx:
                    title = metadatas[idx].get("title", "")
                    if title:
                        clean_title = clean_text(title)
                        # Match if the full title is explicitly mentioned in the enriched query
                        if len(clean_title) >= 3 and clean_title in clean_q:
                            prob_id = metadatas[idx].get("id")
                            print(f"Exact title match found: '{title}' (Problem ID: {prob_id})")
                            
                            if prob_id:
                                raw_docs = db.similarity_search(enriched_query, k=1, filter={"id": prob_id})
                                if raw_docs:
                                    documents.extend(raw_docs)
                                    break
            except Exception as e:
                print(f"Exact title match issue: {e}")

        # FINAL SEMANTIC FALLBACK (e.g. random or pure descriptions)
        if not documents:
            print("Falling back to pure semantic search")
            if 'random' in question:
                documents = db.similarity_search("algorithmic programming problem", k=5)
            else:
                documents = db.similarity_search(enriched_query, k=4)

        context = "\n\n---\n\n".join([doc.page_content for doc in documents])
        print(f"Retrieved {len(documents)} context documents.")
        return {"context": context}

    except Exception as e:
        print(f"Error in retrieve: {str(e)}")
        raise e

def generate(state: GraphState):
    print("---GENERATE---")
    question = state["question"]
    context = state["context"]
    chat_history = state.get("chat_history", [])

    if not context:
        return {"answer": "I couldn't find any relevant information in the training data to answer your question."}

    # Format history into a readable string
    history_text = ""
    for msg in chat_history:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        history_text += f"{role.capitalize()}: {content}\n"

    # RAG Prompt — covers all 7 required rules for display-problems.json fields
    template = """You are an expert AI programming assistant for a coding practice platform (similar to LeetCode).
    Use the provided Context and Chat History to answer the user's Question.

    RULES — follow these strictly:

    - Provide the response in HIGH-FIDELITY MARKDOWN format.
    - Use '## Problem Title' for the main problem title.
    - Use '### Description', '### Constraints', '### Hints', etc., as section headers.
    - Use bolding for key terms and lists for structured data.

    RULE 1 — NAVIGATION (id / tags / companies):
    - If the user asks to find a problem by its numeric ID, match using the 'Problem ID' field in context.
    - If the user asks by topic or tag (e.g. "array", "dynamic programming"), match using the 'Tags' field.
    - If the user asks by company (e.g. "Google", "Amazon"), match using the 'Companies' field.

    RULE 2 — ANSWERING QUESTIONS:
    - Answer the user's question using the 'Description' field as the primary source.
    - If the user asks about problem statistics, use the 'Difficulty', 'Acceptance Rate', and 'Frequency' fields.
    - Cross-reference with the 'Related Q&A / MCQs' section. If the user asks about multiple choice questions, options, or explanations, provide the 'Options', 'Correct Answer Index', and 'Explanation'.
    - Also use the 'Additional Explanation' field for deeper context when available.

    RULE 3 — HINTS:
    - If the user asks for a hint, ONLY use the 'Hints' field. Do NOT reveal the solution.
    - Present hints one at a time if multiple are available.

    RULE 4 — PROBLEM IDENTIFICATION:
    - Use 'Title' as the primary identifier for a problem.
    - Use 'Method Name' as a complementary identifier.
    - Use 'Tags' to understand the problem's topic area.
    - IMPORTANT: When asked for a problem by a specific Company (e.g. Google), check the 'Companies:' field in the Context. 
    - ONLY state a problem belongs to a company if that company name appears in the 'Companies:' list in the context.

    RULE 5 — CODE EVALUATION:
    - If the user submits code, evaluate it against the 'Test Cases' and 'Constraints' fields.
    - Compare the user's approach to 'Optimal Solution Code'. Note if the approach matches, is a brute force variant, or is different.
    - Variable names may differ — evaluate logic, not variable names.

    RULE 6 — CODE OUTPUT:
    - If the user asks for the solution, output the EXACT 'Optimal Solution Code' from context.
    - Wrap code in proper markdown code blocks: ```python\ncode here\n```
    - Default to Python unless the user specifies C++ or Java.
    - NEVER include asterisks (**) or other markdown formatting inside code blocks.

    RULE 7 — COMPLEXITY ANALYSIS:
    - For complexity questions, use these fields: 'Brute Force Time Complexity', 'Brute Force Space Complexity', 'Optimal Time Complexity', 'Optimal Space Complexity'.
    - If the user's code does NOT match the brute force or optimal solution, analyze it verbatim and provide your own complexity assessment.

    If the question is not covered by the context, politely say you don't have that information. Do NOT fabricate solutions.

    Chat History:
    {history_text}

    Context:
    {context}

    Question: {question}

    Answer:"""
    prompt = ChatPromptTemplate.from_template(template)
    
    # Reverting to gemini-2.5-flash as requested
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)
    
    try:
        chain = prompt | llm | StrOutputParser()
        answer = chain.invoke({"context": context, "history_text": history_text, "question": question})
    except Exception as e:
        answer = f"Error generating answer: {str(e)}"
        
    return {"answer": answer}

# --- Graph ---
workflow = StateGraph(GraphState)

workflow.add_node("retrieve", retrieve)
workflow.add_node("generate", generate)

workflow.set_entry_point("retrieve")
workflow.add_edge("retrieve", "generate")
workflow.add_edge("generate", END)

app_graph = workflow.compile()
