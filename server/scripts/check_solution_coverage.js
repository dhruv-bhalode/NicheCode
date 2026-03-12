import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

const problemSchema = new mongoose.Schema({
    title: String,
    optimalSolution: String,
    timeComplexity: String,
    spaceComplexity: String,
    optimalTimeComplexity: String,
    optimalSpaceComplexity: String,
    bruteForceTimeComplexity: String,
    bruteForceSpaceComplexity: String,
    tags: [String],
    topics: [Object]
}, { collection: 'display-problems' });

const Problem = mongoose.model('Problem', problemSchema);

async function checkSolutionCoverage() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB.');

        const total = await Problem.countDocuments({});

        // Check for complexity fields
        const withOptimalComplexity = await Problem.countDocuments({
            $or: [
                { optimalTimeComplexity: { $exists: true, $ne: null } },
                { timeComplexity: { $exists: true, $ne: null } }
            ]
        });

        const withBruteForceComplexity = await Problem.countDocuments({
            bruteForceTimeComplexity: { $exists: true, $ne: null }
        });

        const withTags = await Problem.countDocuments({
            tags: { $exists: true, $not: { $size: 0 } }
        });

        console.log(`Total Problems: ${total}`);
        console.log(`With Optimal Complexity: ${withOptimalComplexity} (${((withOptimalComplexity / total) * 100).toFixed(2)}%)`);
        console.log(`With Brute Force Complexity: ${withBruteForceComplexity} (${((withBruteForceComplexity / total) * 100).toFixed(2)}%)`);
        console.log(`With Tags: ${withTags} (${((withTags / total) * 100).toFixed(2)}%)`);

        // Check a few samples
        const sampleIds = ["1", "100", "500", "1000"];
        for (const id of sampleIds) {
            const p = await Problem.findOne({ id });
            if (p) {
                console.log(`\nSample Problem ${id} (${p.title}):`);
                console.log(`- Optimal Time: ${p.optimalTimeComplexity || p.timeComplexity}`);
                console.log(`- Optimal Space: ${p.optimalSpaceComplexity || p.spaceComplexity}`);
                console.log(`- Brute Force Time: ${p.bruteForceTimeComplexity}`);
                console.log(`- Tags: ${p.tags}`);
            }
        }

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

checkSolutionCoverage();
