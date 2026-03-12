from executor import JavaExecutor
from models import TestCaseInput

def diagnose_java():
    java_code = """
class Solution {
    public int[] solution(int[] nums, int target) {
        java.util.Map<Integer, Integer> prevMap = new java.util.HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int diff = target - nums[i];
            if (prevMap.containsKey(diff)) {
                return new int[] { prevMap.get(diff), i };
            }
            prevMap.put(nums[i], i);
        }
        return new int[0];
    }
}
"""
    test_cases = [
        TestCaseInput(input="nums = [2,7,11,15], target = 9", expected_output="[0,1]")
    ]
    
    executor = JavaExecutor()
    print("Executing Java...")
    results = executor.execute(java_code, test_cases, "solution")
    for r in results:
        print(f"Passed: {r.passed}")
        if r.error:
            print(f"Error: {r.error}")
        print(f"Actual: {r.actual_output}")

if __name__ == "__main__":
    diagnose_java()
