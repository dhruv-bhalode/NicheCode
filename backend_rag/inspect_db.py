import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import json

async def inspect():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['test']
    coll = db['display-problems']
    
    # Check problem 2 (Add Two Numbers) which had __init__ in TS
    p2 = await coll.find_one({"id": "2"})
    if p2:
        print(f"Problem 2 title: {p2.get('title')}")
        print(f"Problem 2 methodName: {p2.get('methodName')}")
        print(f"Problem 2 test cases count: {len(p2.get('test_cases', []))}")
        if p2.get('test_cases'):
            print(f"Problem 2 first test case input: {p2['test_cases'][0].get('input')}")
            print(f"Problem 2 first test case expected: {p2['test_cases'][0].get('expected_output')}")
    else:
        print("Problem 2 not found in DB")

    # Count __init__ problems
    init_count = await coll.count_documents({"methodName": "__init__"})
    print(f"Total problems with methodName '__init__': {init_count}")
    
    # Count missing output problems
    missing_out = await coll.count_documents({"test_cases.expected_output": ""})
    print(f"Total problems with missing expected_output: {missing_out}")

    client.close()

if __name__ == "__main__":
    asyncio.run(inspect())
