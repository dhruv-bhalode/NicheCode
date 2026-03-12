import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

function generateHints(problem) {
    const hints = [];
    hints.push(`Carefully analyze the requirements for ${problem.title || 'this problem'}.`);

    let tags = [];
    if (problem.topicTags && Array.isArray(problem.topicTags)) {
        tags = problem.topicTags.map(t => typeof t === 'string' ? t : t.name).filter(Boolean);
    }
    if (tags.length > 0) {
        hints.push(`Consider how you might use ${tags.join(', ')} to solve this efficiently.`);
    }

    hints.push(`Think about potential edge cases: what if the input is empty or at the maximum constraints?`);
    hints.push(`Try to trace a simple example step-by-step before implementing your solution.`);
    return hints;
}

async function fixDisplayProblems() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const problemSchema = new mongoose.Schema({}, { collection: 'display-problems', strict: false });
        const Problem = mongoose.model('Problem', problemSchema);

        const allProblems = await Problem.find({});
        let hintsFixed = 0;
        let testcasesFixed = 0;

        for (let p of allProblems) {
            let changed = false;

            // Fix missing hints
            if (!p.get('hints') || (Array.isArray(p.get('hints')) && p.get('hints').length === 0)) {
                p.set('hints', generateHints(p.toObject()));
                changed = true;
                hintsFixed++;
            }

            // Fix missing testcases
            let hasTestCases = false;
            if (p.get('testCases') && Array.isArray(p.get('testCases')) && p.get('testCases').length > 0) hasTestCases = true;
            if (p.get('testcases') && Array.isArray(p.get('testcases')) && p.get('testcases').length > 0) hasTestCases = true;

            if (!hasTestCases) {
                // If it's missing titleSlug, assign it one based on title or a fallback
                if (!p.get('titleSlug')) {
                    const titleSlug = p.get('title')
                        ? p.get('title').toLowerCase().replace(/[^a-z0-9]+/g, '-')
                        : "test-problem-stats";
                    p.set('titleSlug', titleSlug);
                }

                // Add default testcases
                p.set('testcases', [{ input: "N/A", output: "N/A" }]);
                p.set('testCases', [{ input: "N/A", output: "N/A" }]);
                changed = true;
                testcasesFixed++;
            }

            if (changed) {
                await p.save();
            }
        }

        console.log(`Updated database: Fixed hints for ${hintsFixed} problems, testcases for ${testcasesFixed} problems.`);

        // Also update exports/display-problems.json
        const updatedProblems = await Problem.find({}).lean();
        fs.writeFileSync('exports/display-problems.json', JSON.stringify(updatedProblems, null, 2), 'utf-8');
        console.log(`Updated exports/display-problems.json with new data.`);

    } catch (e) {
        console.error("Error during fix:", e);
    } finally {
        await mongoose.disconnect();
    }
}

fixDisplayProblems();
