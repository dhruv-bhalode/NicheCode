import sys
sys.path.insert(0, 'backend_rag')
import os
from executor import PythonExecutor, JavaExecutor, CppExecutor
from models import TestCaseInput

def test_java():
    code = """
class Solution {
    public int[][] merge(int[][] intervals) {
        return new int[][]{{1,6},{8,10},{15,18}};
    }
}
"""
    tc = TestCaseInput(input="intervals = [[1,3],[2,6],[8,10],[15,18]]", expected_output="[[1,6],[8,10],[15,18]]")
    ex = JavaExecutor()
    res = ex.execute(code, [tc], "merge")[0]
    print(f"Java merged arrays: Actual: {res.actual_output}, Passed: {res.passed}, Error: {res.error}")

def test_cpp():
    code = """
class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        return {{1,6},{8,10},{15,18}};
    }
};
"""
    tc = TestCaseInput(input="intervals = [[1,3],[2,6],[8,10],[15,18]]", expected_output="[[1,6],[8,10],[15,18]]")
    ex = CppExecutor()
    res = ex.execute(code, [tc], "merge")[0]
    print(f"C++ merged arrays: Actual: {res.actual_output}, Passed: {res.passed}, Error: {res.error}")

def test_python():
    code = """
class Solution:
    def merge(self, intervals):
        return [[1,6],[8,10],[15,18]]
"""
    tc = TestCaseInput(input="intervals = [[1,3],[2,6],[8,10],[15,18]]", expected_output="[[1,6],[8,10],[15,18]]")
    ex = PythonExecutor()
    res = ex.execute(code, [tc], "merge")[0]
    print(f"Python merged arrays: Actual: {res.actual_output}, Passed: {res.passed}, Error: {res.error}")

if __name__ == "__main__":
    test_java()
    test_cpp()
    test_python()
