
import requests

def test_apis():
    # 1. Test Jaagrav CodeX
    print("Testing Jaagrav CodeX...")
    try:
        url = "https://api.codex.jaagrav.in"
        # Guessing endpoint based on common patterns or simple POST to root
        payload = {
            "code": "#include <iostream>\nint main() { std::cout << \"Hello CodeX\"; return 0; }",
            "language": "cpp",
            "input": ""
        }
        resp = requests.post(url, data=payload, timeout=5)
        print(f"CodeX Status: {resp.status_code}")
        print(f"CodeX Response: {resp.text[:200]}")
    except Exception as e:
        print(f"CodeX Error: {e}")

    # 2. Test Judge0 Public (ce.judge0.com)
    print("\nTesting Judge0 Public...")
    try:
        url = "https://ce.judge0.com/submissions?base64_encoded=false&wait=true"
        payload = {
            "source_code": "#include <iostream>\nint main() { std::cout << \"Hello Judge0\"; return 0; }",
            "language_id": 54, # C++ (GCC 9.2.0)
            "stdin": ""
        }
        resp = requests.post(url, json=payload, timeout=5)
        print(f"Judge0 Status: {resp.status_code}")
        print(f"Judge0 Response: {resp.text[:200]}")
    except Exception as e:
        print(f"Judge0 Error: {e}")

if __name__ == "__main__":
    test_apis()
