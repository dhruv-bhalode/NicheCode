
import os
from pymongo import MongoClient
import pprint
from dotenv import load_dotenv

# Load .env from parent directory
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(dotenv_path)

# MongoDB URI from .env
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    print("Error: MONGO_URI not found in .env")
    exit(1)

def verify_db():
    try:
        client = MongoClient(MONGO_URI)
        db = client.get_database("capstone")
        
        print("\n=== Collection List ===")
        print(db.list_collection_names())
        
        display_col = db["display-problems"]
        
        print("\n=== Inspecting 'Two Sum' in 'display-problems' ===")
        # Try exact match
        doc = display_col.find_one({"title": "Two Sum"})
        if doc:
            print("Found 'Two Sum':")
            print(f"_id: {doc['_id']}")
            pprint.pprint({k:v for k,v in doc.items() if k in ['title', 'frequency', 'companies']})
        else:
            print("'Two Sum' NOT FOUND in 'display-problems'. Checking random doc...")
            random_doc = display_col.find_one()
            if random_doc:
                print("Random Doc Sample:")
                pprint.pprint({k:v for k,v in random_doc.items() if k in ['title', 'frequency', 'companies']})
            else:
                print("Collection 'display-problems' appears EMPTY.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    verify_db()
