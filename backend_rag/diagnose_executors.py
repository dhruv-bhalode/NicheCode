import sys
import os
from executor import PythonExecutor, CppExecutor, JavaExecutor
from models import TestCaseInput

def test_cpp():
    print("\n--- Testing C++ Executor ---")
    executor = CppExecutor()
    
    # 1. Standard Problem: Two Sum
    code = """
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> m;
        for (int i = 0; i < nums.size(); ++i) {
            if (m.count(target - nums[i])) return {m[target - nums[i]], i};
            m[nums[i]] = i;
        }
        return {};
    }
};
"""
    test_cases = [TestCaseInput(input="nums=[2,7,11,15], target=9", expected_output="[0,1]")]
    results = executor.execute(code, test_cases, "twoSum")
    for r in results:
        print(f"Standard Problem - Passed: {r.passed}, Output: {r.actual_output}, Error: {r.error}")

    # 2. Tree Problem: Flatten Binary Tree
    code_tree = """
class Solution {
public:
    void flatten(TreeNode* root) {
        if (!root) return;
        flatten(root->left);
        flatten(root->right);
        TreeNode* temp = root->right;
        root->right = root->left;
        root->left = nullptr;
        while (root->right) root = root->right;
        root->right = temp;
    }
};
"""
    test_cases_tree = [TestCaseInput(input="root=[1,2,5,3,4,null,6]", expected_output="[1,null,2,null,3,null,4,null,5,null,6]")]
    results = executor.execute(code_tree, test_cases_tree, "flatten")
    for r in results:
        print(f"Tree Problem - Passed: {r.passed}, Output: {r.actual_output}, Error: {r.error}")

    # 3. Design Problem: MyStack (225)
    code_design = """
class MyStack {
public:
    queue<int> q;
    MyStack() {}
    void push(int x) {
        q.push(x);
        for (int i = 0; i < (int)q.size() - 1; ++i) {
            q.push(q.front());
            q.pop();
        }
    }
    int pop() {
        int x = q.front();
        q.pop();
        return x;
    }
    int top() {
        return q.front();
    }
    bool empty() {
        return q.empty();
    }
};
"""
    test_input = '["MyStack", "push", "push", "top", "pop", "empty"]\n[[], [1], [2], [], [], []]'
    test_cases_design = [TestCaseInput(input=test_input, expected_output="[null, null, null, 2, 2, false]")]
    results = executor.execute(code_design, test_cases_design)
    for r in results:
        print(f"Design Problem - Passed: {r.passed}, Output: {r.actual_output}, Error: {r.error}")

def test_java():
    print("\n--- Testing Java Executor ---")
    executor = JavaExecutor()
    
    # 1. Standard Problem: Two Sum
    code = """
import java.util.*;
public class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            if (map.containsKey(target - nums[i])) return new int[]{map.get(target - nums[i]), i};
            map.put(nums[i], i);
        }
        return new int[0];
    }
}
"""
    test_cases = [TestCaseInput(input="nums=[2,7,11,15], target=9", expected_output="[0,1]")]
    results = executor.execute(code, test_cases, "twoSum")
    for r in results:
        print(f"Standard Problem - Passed: {r.passed}, Output: {r.actual_output}, Error: {r.error}")

if __name__ == "__main__":
    test_cpp()
    test_java()
