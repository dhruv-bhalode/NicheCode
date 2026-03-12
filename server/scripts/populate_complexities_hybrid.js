
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;
const PROBLEMS_JSON_PATH = path.join(__dirname, '../../public/problems.json');

// Define schema flexibly
const problemSchema = new mongoose.Schema({
    title: String,
    optimalTimeComplexity: String,
    optimalSpaceComplexity: String,
    bruteForceTimeComplexity: String,
    bruteForceSpaceComplexity: String,
    tags: [String]
}, { collection: 'display-problems' });

const Problem = mongoose.model('Problem', problemSchema);

// 1. HARDCODED DICTIONARY (Tier 1)
const KNOWN_COMPLEXITIES = {
    "Two Sum": {
        bruteForce: { time: "O(n²)", space: "O(1)" },
        optimal: { time: "O(n)", space: "O(n)" }
    },
    "Add Two Numbers": {
        bruteForce: { time: "O(max(m, n))", space: "O(max(m, n))" },
        optimal: { time: "O(max(m, n))", space: "O(max(m, n))" }
    },
    // ... add more if needed
};

// 2. HEURISTIC RULES
const HEURISTIC_RULES = [
    { tag: "Binary Search", optimalTime: "O(log n)", optimalSpace: "O(1)" },
    { tag: "Two Pointers", optimalTime: "O(n)", optimalSpace: "O(1)" },
    { tag: "Sliding Window", optimalTime: "O(n)", optimalSpace: "O(1)" },
    { tag: "Hash Table", optimalTime: "O(n)", optimalSpace: "O(n)" },
    { tag: "Stack", optimalTime: "O(n)", optimalSpace: "O(n)" },
    { tag: "Queue", optimalTime: "O(n)", optimalSpace: "O(n)" },
    { tag: "Linked List", optimalTime: "O(n)", optimalSpace: "O(1)" },
    { tag: "Tree", optimalTime: "O(n)", optimalSpace: "O(h)" },
    { tag: "Depth-First Search", optimalTime: "O(V + E)", optimalSpace: "O(V)" },
    { tag: "Breadth-First Search", optimalTime: "O(V + E)", optimalSpace: "O(V)" },
    { tag: "Sorting", optimalTime: "O(n log n)", optimalSpace: "O(log n)" },
    { tag: "Dynamic Programming", optimalTime: "O(n)", optimalSpace: "O(n)" },
    { tag: "Backtracking", optimalTime: "O(2^n)", optimalSpace: "O(n)" },
    { tag: "Greedy", optimalTime: "O(n log n)", optimalSpace: "O(1)" },
];

function getHeuristicComplexity(topics) {
    if (!topics || topics.length === 0) return null;

    let result = {
        bruteForce: { time: "O(n²)", space: "O(1)" },
        optimal: { time: "O(n)", space: "O(n)" }
    };

    let matchedRule = null;

    for (const rule of HEURISTIC_RULES) {
        const match = topics.some(t => {
            const tagName = (typeof t === 'string') ? t : t.name;
            return tagName === rule.tag;
        });

        if (match) {
            matchedRule = rule;
            result.optimal.time = rule.optimalTime;
            result.optimal.space = rule.optimalSpace;

            if (rule.optimalTime === "O(log n)") result.bruteForce.time = "O(n)";
            else if (rule.optimalTime === "O(n log n)") result.bruteForce.time = "O(n²)";
            else if (rule.optimalTime.includes("2^n")) result.bruteForce.time = "O(n!)";

            break;
        }
    }

    return { result, matchedRule };
}

async function main() {
    try {
        console.log("Loading problems.json...");
        const rawData = fs.readFileSync(PROBLEMS_JSON_PATH, 'utf-8');
        const problemsData = JSON.parse(rawData);

        // Build Map: Title -> Topics
        const topicMap = new Map();
        problemsData.forEach(p => {
            if (p.title && p.tags) {
                topicMap.set(p.title, p.tags);
            }
        });
        console.log(`Loaded ${topicMap.size} topics from JSON.`);

        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB.");

        const cursor = Problem.find({}).cursor();
        let count = 0;

        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            let complexity = null;
            let source = "";

            if (doc.title && KNOWN_COMPLEXITIES[doc.title]) {
                complexity = KNOWN_COMPLEXITIES[doc.title];
                source = "Hardcoded";
            } else {
                // Lookup topics from map
                const topics = topicMap.get(doc.title);

                // CRITICAL FIX: Populate tags if missing
                if (topics && (!doc.tags || doc.tags.length === 0)) {
                    doc.tags = topics;
                    console.log(`Populating tags for ${doc.title}: ${topics.length} tags`);
                }

                if (topics) {
                    const h = getHeuristicComplexity(topics);
                    if (h && h.result) {
                        complexity = h.result;
                        source = h.matchedRule ? `Heuristic (Tag: ${h.matchedRule.tag})` : "Heuristic (Default)";
                    }
                }
                // Strategy 3: Title Heuristic (Tier 3)
                else {
                    const titleLower = doc.title.toLowerCase();
                    if (titleLower.includes('tree') || titleLower.includes('root') || titleLower.includes('leaf')) {
                        complexity = { bruteForce: { time: "O(n²)", space: "O(h)" }, optimal: { time: "O(n)", space: "O(h)" } };
                        source = "Heuristic (Title: Tree)";
                    } else if (titleLower.includes('sort') || titleLower.includes('merge')) {
                        complexity = { bruteForce: { time: "O(n²)", space: "O(log n)" }, optimal: { time: "O(n log n)", space: "O(log n)" } };
                        source = "Heuristic (Title: Sort)";
                    } else if (titleLower.includes('search') || titleLower.includes('find')) {
                        // Default to O(n) scan
                        complexity = { bruteForce: { time: "O(n)", space: "O(1)" }, optimal: { time: "O(log n)", space: "O(1)" } };
                        source = "Heuristic (Title: Search)";
                    } else if (titleLower.includes('matrix') || titleLower.includes('grid')) {
                        complexity = { bruteForce: { time: "O(m*n)", space: "O(1)" }, optimal: { time: "O(m*n)", space: "O(1)" } };
                        source = "Heuristic (Title: Matrix)";
                    } else {
                        // Ultimate Fallback
                        // complexity = { bruteForce: { time: "O(n²)", space: "O(1)" }, optimal: { time: "O(n)", space: "O(n)" } };
                        // source = "Fallback";
                        // Don't apply fallback to avoid noise, or do? User wants data.
                        // Let's apply a generic "O(n)" assumption for simple problems? No, too risky.
                        // Leave null.
                    }
                }
            }

            if (complexity) {
                doc.bruteForceTimeComplexity = complexity.bruteForce.time;
                doc.bruteForceSpaceComplexity = complexity.bruteForce.space;
                doc.optimalTimeComplexity = complexity.optimal.time;
                doc.optimalSpaceComplexity = complexity.optimal.space;

                await doc.save();
                count++;

                if (count % 100 === 0) {
                    console.log(`Updated ${count}. Last: ${doc.title} [${source}]`);
                }
            }
        }

        console.log(`\nDone. Total Updated: ${count}`);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

main();
