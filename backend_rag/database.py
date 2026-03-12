import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = "capstone" 

class Database:
    client: AsyncIOMotorClient = None
    
    def connect(self):
        if not self.client:
            if not MONGO_URI:
                print("Warning: MONGO_URI not found in environment variables.")
                return
            # Using certifi to be safe across environments
            self.client = AsyncIOMotorClient(
                MONGO_URI, 
                tlsCAFile=certifi.where()
            )
            print("Connected to MongoDB.")

    def get_db(self):
        if not self.client:
            self.connect()
        return self.client[DB_NAME]

    async def close(self):
        if self.client:
            self.client.close()
            print("Closed MongoDB connection.")

db = Database()

def get_database():
    return db.get_db()
