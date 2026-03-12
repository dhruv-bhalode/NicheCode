from graph import app_graph
import asyncio

async def test():
    print("Testing RAG Graph...")
    try:
        inputs = {"question": "Hello"}
        result = await app_graph.ainvoke(inputs)
        print("Result:", result)
    except Exception as e:
        print("RAG Error:", e) # This will print the full traceback

if __name__ == "__main__":
    import asyncio
    asyncio.run(test())
