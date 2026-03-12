
import requests

def test_piston():
    BASE_URL = "https://emkc.org/api/v2/piston"
    
    # Test C++
    print("Testing C++ Execution...")
    cpp_code = """
    #include <iostream>
    using namespace std;
    int main() {
        cout << "Hello from C++ Piston!" << endl;
        return 0;
    }
    """
    payload_cpp = {
        "language": "c++",
        "version": "*",
        "files": [{"content": cpp_code}],
        "stdin": ""
    }
    
    try:
        response = requests.post(f"{BASE_URL}/execute", json=payload_cpp, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"C++ Error: {e}")

    # Test Java
    print("\nTesting Java Execution...")
    java_code = """
    public class Main {
        public static void main(String[] args) {
            System.out.println("Hello from Java Piston!");
        }
    }
    """
    payload_java = {
        "language": "java",
        "version": "*",
        "files": [{"content": java_code}],
        "stdin": ""
    }
    
    try:
        response = requests.post(f"{BASE_URL}/execute", json=payload_java, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Java Error: {e}")

if __name__ == "__main__":
    test_piston()
