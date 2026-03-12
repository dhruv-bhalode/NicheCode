const description = `Given a collection of candidate numbers (candidates) and a target number (target), find all unique combinations in candidates where the candidate numbers sum to target.

Each number in candidates may only be used once in the combination.

Note: The solution set must not contain duplicate combinations.


Example 1:


Input: candidates = [10,1,2,7,6,1,5], target = 8
Output: 
[
[1,1,6],
[1,2,5],
[1,7],
[2,6]
]


Example 2:


Input: candidates = [2,5,2,1,2], target = 5
Output: 
[
[1,2,2],
[5]
]


Constraints:


	1 <= candidates.length <= 100
	1 <= candidates[i] <= 50
	1 <= target <= 30`;

const examplePattern = /Example \d+:[\s\S]*?(?:Input|Input:)\s*([\s\S]*?)\s*(?:Output|Output:)\s*([\s\S]*?)\s*(?:Explanation: ([\s\S]*?)\s*)?(?=Example|Constraints|$)/gi;
let matches;
const newTestCases = [];

while ((matches = examplePattern.exec(description)) !== null) {
    console.log('Match Found!');
    console.log('Input:', matches[1].substring(0, 50));
    console.log('Output:', matches[2].substring(0, 50));
    newTestCases.push({
        input: matches[1].trim(),
        output: matches[2].trim(),
        explanation: matches[3] ? matches[3].trim() : ""
    });
}

console.log('Total matches:', newTestCases.length);
if (newTestCases.length > 0) {
    console.log('First TestCase Output:', newTestCases[0].output);
}
