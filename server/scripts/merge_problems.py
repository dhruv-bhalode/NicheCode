
import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load .env from parent directory
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(dotenv_path)

# MongoDB URI from .env
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    print("Error: MONGO_URI not found in .env")
    exit(1)

def merge_problems():
    try:
        client = MongoClient(MONGO_URI)
        db = client.get_database("capstone")
        
        # Collections
        problems_col = db["problems"]
        display_col = db["display-problems"]
        
        # 1. Fetch source data (1.8K entries)
        print("Fetching source data from 'problems'...")
        source_problems = list(problems_col.find({}, {"title": 1, "frequency": 1, "companies": 1}))
        print(f"Found {len(source_problems)} source problems.")
        
        updated_count = 0
        
        # 2. Iterate and update target
        print("Updating 'display-problems'...")
        
        for src in source_problems:
            if "title" not in src:
                continue
                
            title = src["title"]
            frequency = src.get("frequency", 0)
            companies = src.get("companies", [])
            
            # Update only if title matches
            result = display_col.update_one(
                {"title": title},
                {"$set": {
                    "frequency": frequency,
                    "companies": companies
                }}
            )
            
            if result.modified_count > 0:
                updated_count += 1
                if updated_count % 100 == 0:
                    print(f"Updated {updated_count} records...")
                    
        print(f"Migration Complete!")
        print(f"Total 'display-problems' updated: {updated_count}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    merge_problems()
