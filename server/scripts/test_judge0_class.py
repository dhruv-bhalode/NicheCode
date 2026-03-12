
import sys
import os
import json
sys.path.append(os.path.join(os.path.dirname(__file__), '../../backend_rag'))

from executor import Judge0Executor, TestCaseInput

def test_judge0_executor():
    print("Testing Judge0Executor directly...")
    executor = Judge0Executor()
    
    # Python Test
    print("\n--- Python ---")
    res_py = executor.execute_remote("python", "print('Hello Python from Judge0')")
    print(f"Result: {res_py}")

    # C++ Test
    print("\n--- C++ ---")
    res_cpp = executor.execute_remote("cpp", "#include <iostream>\nint main() { std::cout << \"Hello C++ from Judge0\"; return 0; }")
    print(f"Result: {res_cpp}")
    
    # Java Test
    print("\n--- Java ---")
    java_code = """
    public class Main {
        public static void main(String[] args) {
            System.out.println("Hello Java from Judge0");
        }
    }
    """
    res_java = executor.execute_remote("java", java_code)
    print(f"Result: {res_java}")

if __name__ == "__main__":
    test_judge0_executor()
