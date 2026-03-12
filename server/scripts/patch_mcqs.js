import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROBLEMS_JSON_PATH = path.join(__dirname, '../../public/problems.json');
const PROBLEMS_TS_PATH = path.join(__dirname, '../../src/data/problems.ts');

// Heuristic Map: Tag -> Complexity
const TAG_COMPLEXITY = {
    'Binary Search': 'O(log n)',
    'Divide and Conquer': 'O(n log n)',
    'Sorting': 'O(n log n)',
    'Heap (Priority Queue)': 'O(n log n)',
    'Merge Sort': 'O(n log n)',
    'Bucket Sort': 'O(n)',
    'Radix Sort': 'O(n)',
    'Counting Sort': 'O(n)',
    'Hash Table': 'O(n)',
    'Two Pointers': 'O(n)',
    'Sliding Window': 'O(n)',
    'Stack': 'O(n)',
    'Queue': 'O(n)',
    'Linked List': 'O(n)',
    'Greedy': 'O(n)',
    'Recursion': 'O(2^n)', // Conservative default, though often optimized
    'Backtracking': 'O(2^n)',
    'Dynamic Programming': 'O(n\u00b2)', // Common for 2D DP, acceptable generalization
    'Matrix': 'O(m * n)',
    'Tree': 'O(n)',
    'Graph': 'O(V + E)',
    'Depth-First Search': 'O(V + E)',
    'Breadth-First Search': 'O(V + E)',
    'Bit Manipulation': 'O(1)', // Often O(1) for fixed width, or O(log n)
    'Math': 'O(1)',
    'Trie': 'O(L)' // Length of word
};

const COMPLEXITY_OPTIONS = [
    'O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n\u00b2)', 'O(2^n)', 'O(n!)'
];

const KNOWN_SOLUTIONS = {
    '1': { complexity: 'O(n)', explanation: 'Using a Hash Map allows us to find the complement in O(1) on average.' },
    '2': { complexity: 'O(n)', explanation: 'We traverse both linked lists once.' },
    '3': { complexity: 'O(n)', explanation: 'The sliding window approach visits each character at most twice.' },
    '4': { complexity: 'O(log (m+n))', explanation: 'We use binary search on the smaller array.' },
    '5': { complexity: 'O(n\u00b2)', explanation: 'Expanding around the center for each character takes O(n) time.' }, // Optimally Manacher's is O(n) but DP/Center is O(n^2) common
    '15': { complexity: 'O(n\u00b2)', explanation: '3Sum typically requires sorting O(n log n) and then a nested loop O(n^2).' },
    // Add more if needed, but heuristics handle most
};

function getComplexity(problem) {
    if (KNOWN_SOLUTIONS[problem.id]) return KNOWN_SOLUTIONS[problem.id];

    // Priority to specific tags
    const tags = problem.tags || [];
    for (const tag of tags) {
        if (TAG_COMPLEXITY[tag]) {
            return {
                complexity: TAG_COMPLEXITY[tag],
                explanation: `The problem involves '${tag}', which typically implies a time complexity of ${TAG_COMPLEXITY[tag]}.`
            };
        }
    }

    return { complexity: 'O(n)', explanation: 'A linear scan is often required to process the input.' };
}

function generateMCQs(problem) {
    const { complexity, explanation } = getComplexity(problem);

    // 1. Time Complexity Question
    const correctIndex1 = COMPLEXITY_OPTIONS.indexOf(complexity);
    let options1 = [...COMPLEXITY_OPTIONS];
    // Randomize options order slightly or keep standard? Keeping standard is often cleaner for reading options.
    // Ensure correct answer is present (it is).
    // Let's pick 4 options including the correct one.
    // If correct is O(n), pick O(1), O(n), O(n log n), O(n^2)
    const subsetOptions = ['O(1)', 'O(n)', 'O(n log n)', 'O(n\u00b2)'];
    if (!subsetOptions.includes(complexity)) {
        subsetOptions[3] = complexity; // Ensure it's there
    }
    const finalOptions1 = subsetOptions;
    const finalCorrectIndex1 = finalOptions1.indexOf(complexity);

    const mcq1 = {
        id: `${problem.id}-1`,
        question: `What is the expected time complexity for the optimal solution to '${problem.title}'?`,
        options: finalOptions1,
        correctAnswer: finalCorrectIndex1,
        explanation: `For '${problem.title}', the optimal approach typically achieves ${complexity}. ${explanation}`,
        category: 'algorithm'
    };

    // 2. Data Structure Question (Heuristic)
    let ds = 'Array';
    let dsExplanation = 'Arrays are fundamental.';
    if (problem.tags.includes('Stack')) { ds = 'Stack'; dsExplanation = 'LIFO behavior is key here.'; }
    else if (problem.tags.includes('Queue')) { ds = 'Queue'; dsExplanation = 'FIFO processing is needed.'; }
    else if (problem.tags.includes('Hash Table')) { ds = 'Hash Map'; dsExplanation = 'Fast lookups are essential.'; }
    else if (problem.tags.includes('Tree') || problem.tags.includes('Binary Search Tree')) { ds = 'Tree / BST'; dsExplanation = 'Hierarchical data organization.'; }
    else if (problem.tags.includes('Heap (Priority Queue)')) { ds = 'Heap / Priority Queue'; dsExplanation = 'Efficient max/min retrieval.'; }
    else if (problem.tags.includes('Graph')) { ds = 'Adjacency List/Matrix'; dsExplanation = 'Modeling connections.'; }
    else if (problem.tags.includes('Linked List')) { ds = 'Linked List'; dsExplanation = 'Pointer manipulation.'; }

    const dsOptions = ['Hash Map', 'Stack', 'Queue', 'Heap / Priority Queue'];
    if (!dsOptions.includes(ds)) dsOptions[0] = ds; // Swap if not present

    const finalCorrectIndex2 = dsOptions.indexOf(ds);

    const mcq2 = {
        id: `${problem.id}-2`,
        question: `Which data structure is most critical for solving '${problem.title}' efficiently?`,
        options: dsOptions,
        correctAnswer: finalCorrectIndex2,
        explanation: dsExplanation,
        category: 'data-structure'
    };

    return [mcq1, mcq2];
}


function decodeHtml(html) {
    if (!html) return html;
    return html
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&');
}

function cleanProblem(problem) {
    problem.description = decodeHtml(problem.description);
    problem.title = decodeHtml(problem.title);
    problem.testCases = problem.testCases.map(tc => ({
        input: decodeHtml(tc.input),
        output: decodeHtml(tc.output),
        explanation: decodeHtml(tc.explanation)
    }));
    return problem;
}

async function patchProblems() {
    console.log("Reading problems.json...");
    let rawData = fs.readFileSync(PROBLEMS_JSON_PATH, 'utf-8');
    let problems = JSON.parse(rawData);

    console.log(`Found ${problems.length} problems. Starting batch processing...`);

    const batchSize = 25;
    for (let i = 0; i < problems.length; i += batchSize) {
        const batchEnd = Math.min(i + batchSize, problems.length);
        const batch = problems.slice(i, batchEnd);

        for (let j = 0; j < batch.length; j++) {
            let problem = problems[i + j];

            // Clean HTML Entities
            problem = cleanProblem(problem);

            // Generate MCQs
            problem.mcqs = generateMCQs(problem);
        }

        console.log(`Processed batch ${Math.ceil((i + 1) / batchSize)} / ${Math.ceil(problems.length / batchSize)} (IDs ${i + 1}-${batchEnd})`);
    }

    console.log("Writing to problems.json...");
    fs.writeFileSync(PROBLEMS_JSON_PATH, JSON.stringify(problems, null, 2));

    console.log("Writing to src/data/problems.ts...");
    const tsContent = `
export interface TestCase {
    input: string;
    output: string;
    explanation?: string;
}

export interface MCQQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    category: 'data-structure' | 'algorithm' | 'approach';
}

export interface Problem {
    id: string;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    description: string;
    inputFormat: string;
    outputFormat: string;
    constraints: string[];
    testCases: TestCase[];
    tags: string[];
    hints: string[];
    optimalSolution: string;
    timeComplexity?: string;
    spaceComplexity?: string;
    template: string;
    templates?: { [key: string]: string };
    methodName: string;
    mcqs: MCQQuestion[];
    acceptanceRate?: number;
    frequency?: number;
    companies?: string[];
}

export const problems: Problem[] = ${JSON.stringify(problems, null, 4)};
`;
    fs.writeFileSync(PROBLEMS_TS_PATH, tsContent);

    console.log("Patch complete!");
}

patchProblems();
