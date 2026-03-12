from executor import PythonExecutor, CppExecutor, JavaExecutor
from models import TestCaseInput
import json

def test_complex_ds():
    print("Testing Tree and Linked List Serialization...")
    
    # Test Data: Problem 95 style return (List of Trees)
    # For now let's just test a single tree return
    test_cases = [
        TestCaseInput(input="val = 1", expected_output="[1,2,null,3]")
    ]

    cpp_code = """
class Solution {
public:
    TreeNode* solution(int val) {
        TreeNode* root = new TreeNode(1);
        root->left = new TreeNode(2);
        root->left->left = new TreeNode(3);
        return root;
    }
};
"""
    java_code = """
class Solution {
    public TreeNode solution(int val) {
        TreeNode root = new TreeNode(1);
        root.left = new TreeNode(2);
        root.left.left = new TreeNode(3);
        return root;
    }
}
"""

    executors = {
        "C++": CppExecutor(),
        "Java": JavaExecutor()
    }

    for lang, executor in executors.items():
        print(f"\n--- Testing {lang} (Tree Return) ---")
        code = cpp_code if lang == "C++" else java_code
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
    test_complex_ds()
