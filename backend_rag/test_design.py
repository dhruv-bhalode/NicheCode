from executor import PythonExecutor, CppExecutor, JavaExecutor
from models import TestCaseInput
import json

def test_design_problems():
    print("Testing Design Pattern Execution (Problem 225)...")
    
    test_cases = [
        TestCaseInput(
            input='["MyStack", "push", "push", "top", "pop", "empty"]\n[[], [1], [2], [], [], []]',
            expected_output='[null, null, null, 2, 2, false]'
        )
    ]

    python_code = """
from collections import deque
class MyStack:
    def __init__(self):
        self.q = deque()
    def push(self, x: int) -> None:
        self.q.append(x)
        for _ in range(len(self.q) - 1):
            self.q.append(self.q.popleft())
    def pop(self) -> int:
        return self.q.popleft()
    def top(self) -> int:
        return self.q[0]
    def empty(self) -> bool:
        return not self.q
"""

    cpp_code = """
class MyStack {
public:
    queue<int> q;
    MyStack() {}
    void push(int x) {
        q.push(x);
        for(int i=0; i<q.size()-1; ++i){
            q.push(q.front());
            q.pop();
        }
    }
    int pop() {
        int res = q.front();
        q.pop();
        return res;
    }
    int top() {
        return q.front();
    }
    bool empty() {
        return q.empty();
    }
};
"""

    java_code = """
class MyStack {
    Queue<Integer> q = new LinkedList<>();
    public MyStack() {}
    public void push(int x) {
        q.add(x);
        for(int i=0; i<q.size()-1; i++){
            q.add(q.remove());
        }
    }
    public int pop() {
        return q.remove();
    }
    public int top() {
        return q.peek();
    }
    public boolean empty() {
        return q.isEmpty();
    }
}
"""

    executors = {
        "Python": PythonExecutor(),
        "C++": CppExecutor(),
        "Java": JavaExecutor()
    }

    for lang, executor in executors.items():
        print(f"\n--- Testing {lang} (Design Pattern) ---")
        code = python_code if lang == "Python" else (cpp_code if lang == "C++" else java_code)
        try:
            results = executor.execute(code, test_cases)
            for r in results:
                print(f"Passed: {r.passed}")
                print(f"Actual: {r.actual_output}")
                if r.error:
                    print(f"Error: {r.error}")
        except Exception as e:
            print(f"{lang} Exception: {e}")

if __name__ == "__main__":
    test_design_problems()
