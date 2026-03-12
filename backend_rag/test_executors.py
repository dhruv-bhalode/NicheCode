from executor import PythonExecutor, CppExecutor, JavaExecutor
from models import TestCaseInput
import json

def test_executors():
    print("Testing Basic Execution Consistency...")
    
    test_cases = [
        TestCaseInput(input="nums = [2,7,11,15], target = 9", expected_output="[0,1]")
    ]

    python_code = """
class Solution:
    def solution(self, nums, target):
        return [0, 1]
"""
    cpp_code = """
class Solution {
public:
    vector<int> solution(vector<int>& nums, int target) {
        return {0, 1};
    }
};
"""
    java_code = """
class Solution {
    public int[] solution(int[] nums, int target) {
        return new int[]{0, 1};
    }
}
"""

    executors = {
        "Python": PythonExecutor(),
        "C++": CppExecutor(),
        "Java": JavaExecutor()
    }

    for lang, executor in executors.items():
        print(f"\n--- Testing {lang} ---")
        code = cpp_code if lang == "C++" else (java_code if lang == "Java" else python_code)
        try:
            results = executor.execute(code, test_cases, "solution")
            for r in results:
                print(f"Passed: {r.passed}")
                print(f"Actual: {r.actual_output}")
                if r.error:
                    print(f"Error: {r.error}")
        except Exception as e:
            print(f"{lang} Exception: {e}")

if __name__ == "__main__":
    test_executors()
