import subprocess
import tempfile
import os
import sys
import json
import ast
import re
from typing import List, Optional, Any, Dict
from models import TestCaseInput, TestCaseResult
from abc import ABC, abstractmethod
import requests
import time
import random

class BaseExecutor(ABC):
    @staticmethod
    def normalize_value(val: Any) -> str:
        """Normalize a value for comparison by converting to JSON string and removing whitespace."""
        try:
            if isinstance(val, str):
                try:
                    val = json.loads(val.replace("'", '"'))
                except:
                    try:
                        val = ast.literal_eval(val)
                    except:
                        pass
            
            normalized = json.dumps(val, sort_keys=True, separators=(',', ':'))
            return normalized
        except:
            return str(val).strip()

    @abstractmethod
    def execute(self, code: str, test_cases: List[TestCaseInput], method_name: Optional[str] = None) -> List[TestCaseResult]:
        pass

    def is_design_problem(self, input_str: str) -> bool:
        """Detect if the input follows the 'Design' problem pattern: 
        [\"Class\", \"method1\"]\n[[], [arg1]]
        """
        try:
            lines = [line.strip() for line in input_str.strip().split('\n') if line.strip()]
            if len(lines) < 2: return False
            
            # First line should be a list of strings
            try:
                commands = json.loads(lines[0])
                if not isinstance(commands, list) or not commands or not isinstance(commands[0], str):
                    return False
                
                # Second line should be a list of lists (arguments)
                args = json.loads(lines[1])
                if not isinstance(args, list) or len(args) != len(commands):
                    return False
                
                return True
            except:
                return False
        except:
            return False

    def compare_results(self, actual: Any, expected_str: str) -> bool:
        """Compare actual result with expected result string, handling strict and unordered list comparisons."""
        try:
            # Parse actual if it's a string from stdout
            if isinstance(actual, str):
                actual_str = actual.strip()
                if not actual_str: actual = None
                else:
                    try: actual = json.loads(actual_str)
                    except: 
                        try: actual = ast.literal_eval(actual_str)
                        except: pass

            # Parse expected string to object
            try:
                expected = json.loads(expected_str)
            except:
                try:
                    expected = ast.literal_eval(expected_str)
                except:
                    # Treat as string
                    expected = expected_str.strip()

            # 1. Strict equality
            if actual == expected:
                return True
            
            # 2. Stringified normalization (handles whitespace diffs)
            if self.normalize_value(actual) == self.normalize_value(expected_str):
                return True

            # 3. Unordered list comparison (if both are lists)
            if isinstance(actual, list) and isinstance(expected, list):
                # Try sorting both
                try:
                    def make_comparable(item):
                        if isinstance(item, list):
                            return tuple(make_comparable(x) for x in item)
                        if isinstance(item, dict):
                            return tuple(sorted((k, make_comparable(v)) for k, v in item.items()))
                        return item
                    
                    actual_comp = [make_comparable(x) for x in actual]
                    expected_comp = [make_comparable(x) for x in expected]
                    
                    if sorted(actual_comp) == sorted(expected_comp):
                        return True
                except Exception:
                    pass
            
            return False
            
        except Exception:
            return False

class Judge0Executor:
    """Fallback executor using Judge0 Public API"""
    BASE_URL = "https://ce.judge0.com/submissions?base64_encoded=false&wait=true"
    
    def execute_remote(self, language: str, code: str, input_str: str = "") -> Dict:
        try:
            # Judge0 Language IDs
            # C++ (GCC 9.2.0): 54
            # Java (OpenJDK 13.0.1): 62
            # Python (3.8.1): 71
            lang_map = {
                "cpp": 54, "java": 62, "python": 71
            }
            lang_id = lang_map.get(language)
            if not lang_id:
                 return {"error": f"Language '{language}' not supported by Judge0 fallback."}
            
            payload = {
                "source_code": code,
                "language_id": lang_id,
                "stdin": input_str
            }
            
            response = requests.post(self.BASE_URL, json=payload, timeout=10)
            if response.status_code not in [200, 201]:
                return {"error": f"Judge0 API Error: {response.status_code} - {response.text}"}
                
            data = response.json()
            
            # Check status
            status = data.get("status", {})
            if status.get("id") != 3: # 3 is Accepted
                 # Compilation error or Runtime error
                 error_msg = data.get("compile_output") or data.get("stderr") or status.get("description") or "Unknown Error"
                 return {
                     "output": data.get("stdout", ""),
                     "error": error_msg
                 }
            
            return {
                "output": data.get("stdout", ""),
                "error": None
            }
        except Exception as e:
            return {"error": f"Remote Execution Failed: {str(e)}"}

class PythonExecutor(BaseExecutor):
    def get_serialization_helpers(self) -> str:
        return """
from collections import deque
import json
from typing import *

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def build_tree(values):
    if not values: return None
    root = TreeNode(values[0])
    queue = deque([root])
    i = 1
    while queue and i < len(values):
        node = queue.popleft()
        if i < len(values) and values[i] is not None:
            node.left = TreeNode(values[i])
            queue.append(node.left)
        i += 1
        if i < len(values) and values[i] is not None:
            node.right = TreeNode(values[i])
            queue.append(node.right)
        i += 1
    return root

def build_list(values):
    if not values: return None
    dummy = ListNode(0)
    current = dummy
    for val in values:
        current.next = ListNode(val)
        current = current.next
    return dummy.next

def list_to_array(head):
    result = []
    while head:
        result.append(head.val)
        head = head.next
    return result

def tree_to_list(root):
    \"\"\"Serialize a tree to level-order list (LeetCode format), omitting trailing Nones.\"\"\"
    if not root:
        return []
    result = []
    queue = deque([root])
    while queue:
        node = queue.popleft()
        if node is None:
            result.append(None)
        else:
            result.append(node.val)
            queue.append(node.left)
            queue.append(node.right)
    # Strip trailing Nones
    while result and result[-1] is None:
        result.pop()
    return result

def serialize_result(obj):
    if obj is None: return None
    if hasattr(obj, 'val') and hasattr(obj, 'left') and hasattr(obj, 'right'):
        return tree_to_list(obj)
    if hasattr(obj, 'val') and hasattr(obj, 'next'):
        return list_to_array(obj)
    if isinstance(obj, (list, tuple)):
        return [serialize_result(item) for item in obj]
    if isinstance(obj, dict):
        return {k: serialize_result(v) for k, v in obj.items()}
    return obj
"""

    def generate_wrapper(self, user_code: str, test_input: str, method_name: Optional[str] = None) -> str:
        if self.is_design_problem(test_input):
            return self.generate_design_wrapper(user_code, test_input)
        
        helpers = self.get_serialization_helpers()
        wrapper_script = f"""
import sys
import ast
import re
{helpers}

{user_code}

def main():
    try:
        input_str = {repr(test_input)}
        normalized_input = input_str.replace('null', 'None').replace('true', 'True').replace('false', 'False')
        
        context = {{}}
        pairs = re.split(r",\s*(?=[a-zA-Z_]\w*\s*=)", normalized_input)
        for pair in pairs:
            if '=' in pair:
                parts = pair.split('=', 1)
                context[parts[0].strip()] = ast.literal_eval(parts[1].strip())
        
        if 'root' in context and isinstance(context['root'], list):
            context['root'] = build_tree(context['root'])
        
        list_params = ['l1', 'l2', 'head', 'headA', 'headB', 'list1', 'list2', 'lists']
        for p in list_params:
            if p in context and isinstance(context[p], list):
                if p == 'lists' and context[p] and isinstance(context[p][0], list):
                    context[p] = [build_list(lst) for lst in context[p]]
                else:
                    context[p] = build_list(context[p])
        
        sol = Solution()
        target = {repr(method_name)}
        if not target:
            methods = [m for m in dir(sol) if not m.startswith('__') and callable(getattr(sol, m))]
            target = methods[0] if methods else None
        
        if not target:
            print(json.dumps({{"error": "No method found"}}))
            return

        method = getattr(sol, target)
        result = method(**context)
        print(json.dumps(serialize_result(result)))
        
    except Exception as e:
        print(json.dumps({{"error": str(e)}}))

if __name__ == "__main__":
    main()
"""
        return wrapper_script

    def generate_design_wrapper(self, user_code: str, test_input: str) -> str:
        helpers = self.get_serialization_helpers()
        wrapper_script = f"""
import sys
import ast
{helpers}

{user_code}

def main():
    try:
        input_str = {repr(test_input)}
        lines = [l.strip() for l in input_str.strip().split('\\n') if l.strip()]
        commands = json.loads(lines[0])
        args_list = json.loads(lines[1])
        
        outputs = []
        obj = None
        
        for i in range(len(commands)):
            cmd = commands[i]
            args = args_list[i]
            
            if i == 0:
                # Constructor
                cls = globals().get(cmd)
                if not cls: raise Exception(f"Class {{cmd}} not found")
                obj = cls(*args)
                outputs.append(None)
            else:
                method = getattr(obj, cmd)
                res = method(*args)
                outputs.append(serialize_result(res))
                
        print(json.dumps(outputs))
    except Exception as e:
        print(json.dumps({{"error": str(e)}}))

if __name__ == "__main__":
    main()
"""
        return wrapper_script

    def execute(self, code: str, test_cases: List[TestCaseInput], method_name: Optional[str] = None) -> List[TestCaseResult]:
        results = []
        for tc in test_cases:
            full_code = self.generate_wrapper(code, tc.input, method_name)
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8') as f:
                f.write(full_code)
                temp_path = f.name
            
            try:
                start_time = time.time()
                proc = subprocess.run([sys.executable, temp_path], capture_output=True, text=True, timeout=5)
                duration = (time.time() - start_time) * 1000
                output_raw = proc.stdout.strip()
                
                if proc.returncode != 0:
                    results.append(TestCaseResult(input=tc.input, expected_output=tc.expected_output, actual_output="", passed=False, error=proc.stderr, runtime=duration))
                    continue
                
                try:
                    actual_val = json.loads(output_raw)
                    passed = self.compare_results(actual_val, tc.expected_output)
                    results.append(TestCaseResult(
                        input=tc.input, expected_output=tc.expected_output,
                        actual_output=output_raw, passed=passed, runtime=duration, memory=random.uniform(5000, 10000)
                    ))
                except json.JSONDecodeError:
                    results.append(TestCaseResult(input=tc.input, expected_output=tc.expected_output, actual_output=output_raw, passed=False, error="Invalid output format", runtime=duration))
            except Exception as e:
                results.append(TestCaseResult(input=tc.input, expected_output=tc.expected_output, actual_output="", passed=False, error=str(e), runtime=0, memory=0))
            finally:
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
        return results

class CppExecutor(BaseExecutor):
    def convert_to_cpp_val(self, val_str: str) -> str:
        """Convert a value string (JSON-like) to C++ syntax."""
        val_str = val_str.strip()
        if not val_str: return "0"
        if val_str.startswith('[') and val_str.endswith(']'):
            content = val_str[1:-1]
            return '{' + content.replace('[', '{').replace(']', '}') + '}'
        if val_str == "true": return "true"
        if val_str == "false": return "false"
        if val_str == "null": return "nullptr"
        return val_str

    def parse_input_vars(self, input_str: str) -> List[str]:
        parts = re.split(r",\s*(?=[a-zA-Z_]\w*\s*=)", input_str)
        values = []
        for p in parts:
            if '=' in p:
                val = p.split('=', 1)[1].strip()
                values.append(self.convert_to_cpp_val(val))
            else:
                values.append(self.convert_to_cpp_val(p))
        return values

    def get_method_params(self, code: str, method_name: str) -> List[str]:
        """Extract parameter types from the method signature in the code."""
        pattern = rf"{method_name}\s*\((.*?)\)"
        match = re.search(pattern, code)
        if match:
            params_str = match.group(1)
            params = []
            bracket_level = 0
            current = ""
            for char in params_str:
                if char == '<': bracket_level += 1
                elif char == '>': bracket_level -= 1
                if char == ',' and bracket_level == 0:
                    params.append(current.strip())
                    current = ""
                else:
                    current += char
            if current: params.append(current.strip())
            
            types = []
            for p in params:
                # Remove parameter name (last word)
                parts = p.split()
                if len(parts) > 1:
                    type_str = " ".join(parts[:-1]).replace('&', '').strip()
                    types.append(type_str)
            return types
        return []

    def is_void_return(self, code: str, method_name: str) -> bool:
        """Check if the method has a void return type."""
        pattern = rf"(\w+)\s+{method_name}\s*\("
        match = re.search(pattern, code)
        if match:
            return match.group(1) == "void"
        return False


    def guess_cpp_type(self, val_str: str) -> str:
        """Guess the C++ type of a JSON-like value string."""
        val_str = val_str.strip()
        if not val_str: return "int"
        if val_str == "true" or val_str == "false": return "bool"
        if val_str == "null" or val_str == "nullptr": return "TreeNode*"
        if val_str.startswith('"'): return "string"
        if val_str.startswith('['):
            try:
                # Handle nulls in json
                json_str = val_str.replace("null", "None") # Not quite right for json.loads but okay for check
                if "null" in val_str: return "TreeNode*"
                lst = json.loads(val_str.replace("'", '"'))
                if not lst: return "vector<int>"
                inner = lst[0]
                if isinstance(inner, int): return "vector<int>"
                if isinstance(inner, str): return "vector<string>"
                if isinstance(inner, bool): return "vector<bool>"
                return "vector<int>"
            except:
                if "null" in val_str: return "TreeNode*"
                return "vector<int>"
        if '.' in val_str: return "double"
        return "int"


    def execute(self, code: str, test_cases: List[TestCaseInput], method_name: Optional[str] = None) -> List[TestCaseResult]:

        results = []
        import uuid
        
        header = r"""
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <map>
#include <unordered_map>
#include <set>
#include <unordered_set>
#include <queue>
#include <stack>
#include <deque>
#include <list>
#include <sstream>
#include <climits>
#include <cmath>
#include <numeric>
#include <cstdint>

using namespace std;

struct ListNode {
    int val; ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};

struct TreeNode {
    int val; TreeNode *left; TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};

void print_res(int v) { cout << v; }
void print_res(long long v) { cout << v; }
void print_res(double v) { cout << v; }
void print_res(bool v) { cout << (v ? "true" : "false"); }
void print_res(const string& v) { cout << "\"" << v << "\""; }

template<typename T> void print_res(const vector<T>& v);
template<typename T> void print_res(const list<T>& l);
void print_res(TreeNode* root);
void print_res(ListNode* head);

template<typename T>
void print_res(const vector<T>& v) {
    cout << "[";
    for(size_t i=0; i<v.size(); ++i) {
        print_res(v[i]);
        if(i < v.size()-1) cout << ",";
    }
    cout << "]";
}

template<typename T>
void print_res(const list<T>& l) {
    cout << "[";
    auto it = l.begin();
    while (it != l.end()) {
        print_res(*it);
        if (next(it) != l.end()) cout << ",";
        ++it;
    }
    cout << "]";
}

void print_res(ListNode* head) {
    if(!head) { cout << "[]"; return; }
    cout << "[";
    while(head) {
        cout << head->val;
        if(head->next) cout << ",";
        head = head->next;
    }
    cout << "]";
}

void print_res(TreeNode* root) {
    if(!root) { cout << "[]"; return; }
    vector<string> res;
    queue<TreeNode*> q;
    q.push(root);
    while(!q.empty()){
        TreeNode* curr = q.front(); q.pop();
        if(curr) {
            res.push_back(to_string(curr->val));
            q.push(curr->left); q.push(curr->right);
        } else res.push_back("null");
    }
    while(!res.empty() && res.back() == "null") res.pop_back();
    cout << "[";
    for(size_t i=0; i<res.size(); ++i) {
        cout << res[i];
        if(i < res.size()-1) cout << ",";
    }
    cout << "]";
}

TreeNode* buildTree(vector<string> nodes) {
    if (nodes.empty() || nodes[0] == "null") return nullptr;
    TreeNode* root = new TreeNode(stoi(nodes[0]));
    queue<TreeNode*> q;
    q.push(root);
    int i = 1;
    while (!q.empty() && i < nodes.size()) {
        TreeNode* curr = q.front(); q.pop();
        if (i < nodes.size() && nodes[i] != "null") {
            curr->left = new TreeNode(stoi(nodes[i]));
            q.push(curr->left);
        }
        i++;
        if (i < nodes.size() && nodes[i] != "null") {
            curr->right = new TreeNode(stoi(nodes[i]));
            q.push(curr->right);
        }
        i++;
    }
    return root;
}

ListNode* buildList(vector<int> nodes) {
    if (nodes.empty()) return nullptr;
    ListNode* head = new ListNode(nodes[0]);
    ListNode* curr = head;
    for (size_t i = 1; i < nodes.size(); i++) {
        curr->next = new ListNode(nodes[i]);
        curr = curr->next;
    }
    return head;
}
"""
        for tc in test_cases:

            filename = f"temp_{uuid.uuid4().hex}"
            cpp_file = f"{filename}.cpp"
            exe_file = f"{filename}.exe"
            try:
                if self.is_design_problem(tc.input):
                    lines = [l.strip() for l in tc.input.strip().split('\n') if l.strip()]
                    commands = json.loads(lines[0])
                    args_list = json.loads(lines[1])
                    class_name = commands[0]
                    main_body = f"    {class_name}* obj = nullptr;\n    cout << \"[\";\n"
                    for i in range(len(commands)):
                        cmd = commands[i]
                        args = args_list[i]
                        cpp_args = []
                        for a in args:
                            if isinstance(a, bool): cpp_args.append("true" if a else "false")
                            elif a is None: cpp_args.append("nullptr")
                            elif isinstance(a, str): cpp_args.append(f"\"{a}\"")
                            elif isinstance(a, list): cpp_args.append(self.convert_to_cpp_val(json.dumps(a)))
                            else: cpp_args.append(str(a))
                        args_str = ", ".join(cpp_args)
                        if i == 0:
                            main_body += f"    obj = new {class_name}({args_str});\n    cout << \"null\";"
                        else:
                            is_void = cmd in ["push", "add", "append", "insert", "put"]
                            if is_void: main_body += f"\n    obj->{cmd}({args_str});\n    cout << \",null\";"
                            else: main_body += f"\n    cout << \",\";\n    print_res(obj->{cmd}({args_str}));"
                    main_body += "\n    cout << \"]\";"
                    main_func = f"int main() {{\n{main_body}\n    return 0;\n}}"
                else:
                    if not tc.input.strip():
                        arg_values = []
                    else:
                        raw_args = re.split(r",\s*(?=[a-zA-Z_]\w*\s*=)", tc.input)
                        arg_values = []
                        for p in raw_args:
                            if '=' in p: arg_values.append(p.split('=', 1)[1].strip())
                            else: arg_values.append(p.strip())
                    
                    var_defs = ""
                    call_args = []
                    target = method_name or 'solution'
                    sig_types = self.get_method_params(code, target)
                    is_void = self.is_void_return(code, target)
                    
                    for i, val in enumerate(arg_values):
                        cpp_type = sig_types[i] if i < len(sig_types) else self.guess_cpp_type(val)
                        cpp_val = self.convert_to_cpp_val(val)
                        var_name = f"arg{i}"
                        
                        if "TreeNode*" in cpp_type:
                            objs = json.loads(val.replace("null", '"null"'))
                            objs_str = ", ".join([f'"{str(o).lower()}"' for o in objs])
                            var_defs += f"    vector<string> vec_{var_name} = {{{objs_str}}};\n"
                            var_defs += f"    TreeNode* {var_name} = buildTree(vec_{var_name});\n"
                        elif "ListNode*" in cpp_type:
                            var_defs += f"    vector<int> vec_{var_name} = {cpp_val};\n"
                            var_defs += f"    ListNode* {var_name} = buildList(vec_{var_name});\n"
                        else:
                            var_defs += f"    {cpp_type} {var_name} = {cpp_val};\n"
                        call_args.append(var_name)
                    
                    args_str = ", ".join(call_args)
                    if is_void:
                        main_func = f"int main() {{\n{var_defs}    Solution sol;\n    sol.{target}({args_str});\n    print_res({call_args[0]});\n    return 0;\n}}"
                    else:
                        main_func = f"int main() {{\n{var_defs}    Solution sol;\n    print_res(sol.{target}({args_str}));\n    return 0;\n}}"


                full_code = header + code + "\n" + main_func

                with open(cpp_file, 'w', encoding='utf-8') as f: f.write(full_code)
                compile_proc = subprocess.run(["g++", "-std=c++11", cpp_file, "-o", exe_file], capture_output=True, text=True)
                if compile_proc.returncode != 0:
                    results.append(TestCaseResult(input=tc.input, expected_output=tc.expected_output, actual_output="", passed=False, error=compile_proc.stderr))
                    continue
                start_time = time.time()
                run_proc = subprocess.run([os.path.abspath(exe_file)], capture_output=True, text=True, timeout=5)
                results.append(TestCaseResult(
                    input=tc.input, expected_output=tc.expected_output,
                    actual_output=run_proc.stdout.strip(), passed=self.compare_results(run_proc.stdout.strip(), tc.expected_output), error=run_proc.stderr,
                    runtime=(time.time() - start_time) * 1000, memory=random.uniform(5000, 10000)
                ))
            except Exception as e:
                results.append(TestCaseResult(input=tc.input, expected_output=tc.expected_output, actual_output="", passed=False, error=str(e), runtime=0, memory=0))
            finally:
                if os.path.exists(cpp_file): os.unlink(cpp_file)
                if os.path.exists(exe_file): os.unlink(exe_file)
        return results

class JavaExecutor(BaseExecutor):
    def convert_to_java_val(self, val_str: str) -> str:
        val_str = val_str.strip()
        if not val_str: return "0"
        if val_str.startswith('[') and val_str.endswith(']'):
            content = val_str[1:-1]
            return f"new int[]{{{content}}}"
        if val_str.startswith('"'): return val_str
        return val_str

    def parse_input_vars(self, input_str: str) -> List[str]:
        if not input_str.strip():
            return []
        parts = re.split(r",\s*(?=[a-zA-Z_]\w*\s*=)", input_str)
        values = []
        for p in parts:
            if '=' in p:
                val = p.split('=', 1)[1].strip()
                values.append(self.convert_to_java_val(val))
            else:
                values.append(self.convert_to_java_val(p))
        return values

    def execute(self, code: str, test_cases: List[TestCaseInput], method_name: Optional[str] = None) -> List[TestCaseResult]:
        results = []
        for tc in test_cases:
            try:
                if self.is_design_problem(tc.input):
                    lines = [l.strip() for l in tc.input.strip().split('\n') if l.strip()]
                    commands = json.loads(lines[0])
                    args_list = json.loads(lines[1])
                    
                    class_name = commands[0]
                    java_args_list = []
                    for args in args_list:
                        inner_args = ", ".join([self.convert_to_java_val(json.dumps(a)) for a in args])
                        java_args_list.append(f"new Object[]{{{inner_args}}}")
                    
                    all_args_str = ", ".join(java_args_list)
                    commands_str = ", ".join([f"\"{c}\"" for c in commands])
                    
                    user_imports = re.findall(r'^import\s+.*?;', code, re.MULTILINE)
                    sanitized_code = re.sub(r'^import\s+.*?;', '', code, flags=re.MULTILINE)
                    sanitized_code = sanitized_code.replace("public class Solution", "class Solution")
                    imports_str = "\n".join(user_imports)

                    template = """
[USER_IMPORTS]
import java.util.*;
import java.lang.reflect.*;

class ListNode {
    int val; ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

class TreeNode {
    int val; TreeNode left; TreeNode right;
    TreeNode() {}
    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val; this.left = left; this.right = right;
    }
}

public class Main {
    public static void main(String[] args) throws Exception {
        String[] commands = {COMMANDS_PLACEHOLDER};
        Object[][] argsList = {ARGS_PLACEHOLDER};
        List<String> results = new ArrayList<>();
        Object obj = null;
        for (int i = 0; i < commands.length; i++) {
            String cmd = commands[i];
            Object[] callArgs = argsList[i];
            if (i == 0) {
                Class<?> cls = Class.forName(cmd);
                Constructor<?> conn = findConstructor(cls, callArgs.length);
                obj = (Object) conn.newInstance(castArgs(conn.getParameterTypes(), callArgs));
                results.add("null");
            } else {
                Method method = findMethod(obj.getClass(), cmd, callArgs.length);
                Object res = method.invoke(obj, castArgs(method.getParameterTypes(), callArgs));
                results.add(serialize(res));
            }
        }
        System.out.println("[" + String.join(",", results) + "]");
    }

    private static Constructor<?> findConstructor(Class<?> cls, int argCount) {
        for (Constructor<?> c : cls.getDeclaredConstructors()) {
            if (c.getParameterCount() == argCount) {
                c.setAccessible(true);
                return c;
            }
        }
        Constructor<?> first = cls.getDeclaredConstructors()[0];
        first.setAccessible(true);
        return first;
    }

    private static Method findMethod(Class<?> cls, String name, int argCount) {
        for (Method m : cls.getDeclaredMethods()) {
            if (m.getName().equals(name) && m.getParameterCount() == argCount) {
                m.setAccessible(true);
                return m;
            }
        }
        for (Method m : cls.getMethods()) {
            if (m.getName().equals(name) && m.getParameterCount() == argCount) return m;
        }
        throw new RuntimeException("Method " + name + " not found");
    }

    private static Object[] castArgs(Class<?>[] types, Object[] args) {
        Object[] casted = new Object[args.length];
        for (int i = 0; i < args.length; i++) casted[i] = args[i];
        return casted;
    }

    private static String serialize(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof String) return "\\\"" + obj + "\\\"";
        if (obj instanceof Boolean || obj instanceof Integer || obj instanceof Long || obj instanceof Double) return obj.toString();
        if (obj instanceof int[]) return Arrays.toString((int[]) obj).replace(" ", "");
        if (obj instanceof String[]) return Arrays.toString((String[]) obj).replace(" ", "");
        if (obj instanceof ListNode) {
            StringBuilder sb = new StringBuilder("[");
            ListNode curr = (ListNode) obj;
            while (curr != null) {
                sb.append(curr.val);
                if (curr.next != null) sb.append(",");
                curr = curr.next;
            }
            sb.append("]"); return sb.toString();
        }
        if (obj instanceof TreeNode) {
            List<String> res = new ArrayList<>();
            Queue<TreeNode> q = new LinkedList<>();
            q.add((TreeNode) obj);
            while (!q.isEmpty()) {
                TreeNode curr = q.poll();
                if (curr != null) {
                    res.add(String.valueOf(curr.val));
                    q.add(curr.left); q.add(curr.right);
                } else res.add("null");
            }
            while (!res.isEmpty() && res.get(res.size() - 1).equals("null")) res.remove(res.size() - 1);
            return "[" + String.join(",", res) + "]";
        }
        if (obj instanceof List) {
            List<?> list = (List<?>) obj;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) {
                sb.append(serialize(list.get(i)));
                if (i < list.size() - 1) sb.append(",");
            }
            sb.append("]"); return sb.toString();
        }
        return obj.toString();
    }
}
""".replace("[USER_IMPORTS]", imports_str).replace("COMMANDS_PLACEHOLDER", commands_str).replace("ARGS_PLACEHOLDER", all_args_str)
                    main_class_content = template + "\n" + sanitized_code


                else:
                    target = method_name or 'solution'
                    args = self.parse_input_vars(tc.input)
                    args_str = ", ".join(args)
                    
                    # Extract imports from user code and move them to the top
                    user_imports = re.findall(r'^import\s+.*?;', code, re.MULTILINE)
                    sanitized_code = re.sub(r'^import\s+.*?;', '', code, flags=re.MULTILINE)
                    sanitized_code = sanitized_code.replace("public class Solution", "class Solution")
                    
                    imports_str = "\n".join(user_imports)
                    template = """
[USER_IMPORTS]
import java.util.*;

class ListNode {

    int val; ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}


class TreeNode {
    int val; TreeNode left; TreeNode right;
    TreeNode() {}
    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val; this.left = left; this.right = right;
    }
}

public class Main {
    public static void main(String[] args) {
        Solution sol = new Solution();
        Object result = sol.TARGET_METHOD(ARGS_PLACEHOLDER);
        System.out.println(serialize(result));
    }

    private static String serialize(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof String) return "\\\"" + obj + "\\\"";
        if (obj instanceof Boolean || obj instanceof Integer || obj instanceof Long || obj instanceof Double) return obj.toString();
        if (obj instanceof int[]) return Arrays.toString((int[]) obj).replace(" ", "");
        if (obj instanceof String[]) return Arrays.toString((String[]) obj).replace(" ", "");
        if (obj instanceof ListNode) {
            StringBuilder sb = new StringBuilder("[");
            ListNode curr = (ListNode) obj;
            while (curr != null) {
                sb.append(curr.val);
                if (curr.next != null) sb.append(",");
                curr = curr.next;
            }
            sb.append("]"); return sb.toString();
        }
        if (obj instanceof TreeNode) {
            List<String> res = new ArrayList<>();
            Queue<TreeNode> q = new LinkedList<>();
            q.add((TreeNode) obj);
            while (!q.isEmpty()) {
                TreeNode curr = q.poll();
                if (curr != null) {
                    res.add(String.valueOf(curr.val));
                    q.add(curr.left); q.add(curr.right);
                } else res.add("null");
            }
            while (!res.isEmpty() && res.get(res.size() - 1).equals("null")) res.remove(res.size() - 1);
            return "[" + String.join(",", res) + "]";
        }
        if (obj instanceof List) {
            List<?> list = (List<?>) obj;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) {
                sb.append(serialize(list.get(i)));
                if (i < list.size() - 1) sb.append(",");
            }
            sb.append("]"); return sb.toString();
        }
        return obj.toString();
    }
}
""".replace("[USER_IMPORTS]", imports_str).replace("TARGET_METHOD", target).replace("ARGS_PLACEHOLDER", args_str)
                    main_class_content = template + "\n" + sanitized_code


                with tempfile.TemporaryDirectory() as temp_dir:
                    java_file = os.path.join(temp_dir, "Main.java")
                    with open(java_file, 'w', encoding='utf-8') as f:
                        f.write(main_class_content)
                    
                    compile_proc = subprocess.run(["javac", "Main.java"], cwd=temp_dir, capture_output=True, text=True)
                    if compile_proc.returncode != 0:
                        results.append(TestCaseResult(input=tc.input, expected_output=tc.expected_output, actual_output="", passed=False, error=compile_proc.stderr))
                        continue
                        
                    start_time = time.time()
                    run_proc = subprocess.run(["java", "-cp", ".", "Main"], cwd=temp_dir, capture_output=True, text=True, timeout=5)
                    results.append(TestCaseResult(
                        input=tc.input, expected_output=tc.expected_output,
                        actual_output=run_proc.stdout.strip(), passed=self.compare_results(run_proc.stdout.strip(), tc.expected_output), error=run_proc.stderr,
                        runtime=(time.time() - start_time) * 1000, memory= random.uniform(5000, 10000)
                    ))
            except Exception as e:
                results.append(TestCaseResult(input=tc.input, expected_output=tc.expected_output, actual_output="", passed=False, error=str(e), runtime=0, memory=0))
        return results

