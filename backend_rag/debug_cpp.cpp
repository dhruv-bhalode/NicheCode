
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
#include <sstream>

using namespace std;

// LeetCode Data Structures
struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};

// --- Serialization Helpers ---
void print_res(int v) { cout << v; }
void print_res(long long v) { cout << v; }
void print_res(double v) { cout << v; }
void print_res(bool v) { cout << (v ? "true" : "false"); }
void print_res(const string& v) { cout << "\\"" << v << "\\""; }

// Forward declarations for recursion
template<typename T> void print_res(const vector<T>& v);
void print_res(TreeNode* root);
void print_res(ListNode* head);

// Vector Printer
template<typename T>
void print_res(const vector<T>& v) {
    cout << "[";
    for(size_t i=0; i<v.size(); ++i) {
        print_res(v[i]);
        if(i < v.size()-1) cout << ",";
    }
    cout << "]";
}

// Linked List Printer
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

// Tree Printer (Level-order JSON array)
void print_res(TreeNode* root) {
    if(!root) { cout << "[]"; return; }
    vector<string> res;
    queue<TreeNode*> q;
    q.push(root);
    while(!q.empty()){
        TreeNode* curr = q.front(); q.pop();
        if(curr) {
            res.push_back(to_string(curr->val));
            q.push(curr->left);
            q.push(curr->right);
        } else {
            res.push_back("null");
        }
    }
    // Trim trailing nulls
    while(!res.empty() && res.back() == "null") res.pop_back();
    cout << "[";
    for(size_t i=0; i<res.size(); ++i) {
        cout << res[i];
        if(i < res.size()-1) cout << ",";
    }
    cout << "]";
}

class Solution {
public:
    vector<int> solution(vector<int>& nums, int target) {
        return {0, 1};
    }
};

int main() {
    Solution sol;
    vector<int> nums = {2,7,11,15};
    int target = 9;
    print_res(sol.solution(nums, target));
    return 0;
}
