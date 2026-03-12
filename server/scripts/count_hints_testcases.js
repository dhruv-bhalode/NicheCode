import fs from 'fs';

const data = JSON.parse(fs.readFileSync('exports/display-problems.json', 'utf-8'));
let withHints = 0;
let withTestcases = 0;
let withoutHints = 0;
let withoutTestcases = 0;

for (let p of data) {
    if (p.hints && Array.isArray(p.hints) && p.hints.length > 0) {
        withHints++;
    } else {
        withoutHints++;
    }

    if ((p.testcases && Array.isArray(p.testcases) && p.testcases.length > 0) ||
        (p.testCases && Array.isArray(p.testCases) && p.testCases.length > 0)) {
        withTestcases++;
    } else {
        withoutTestcases++;
    }
}

console.log(`Total Problems: ${data.length}`);
console.log(`With Hints: ${withHints}, Without Hints: ${withoutHints}`);
console.log(`With Testcases: ${withTestcases}, Without Testcases: ${withoutTestcases}`);
