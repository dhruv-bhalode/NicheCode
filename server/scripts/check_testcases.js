
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
    testCases: Array
}, { collection: 'display-problems' });

const Problem = mongoose.model('Problem', problemSchema);

async function checkTestCases() {
    try {
        await mongoose.connect(MONGO_URI);

        const total = await Problem.countDocuments({});
        const withTestCases = await Problem.countDocuments({
            testCases: { $exists: true, $not: { $size: 0 } }
        });

        const missing = total - withTestCases;

        console.log(`Total Problems: ${total}`);
        console.log(`With Test Cases: ${withTestCases}`);
        console.log(`Missing Test Cases: ${missing}`);
        console.log(`Coverage: ${((withTestCases / total) * 100).toFixed(2)}%`);

        if (missing > 0) {
            console.log("\nSample problems without test cases:");
            const samples = await Problem.find({
                $or: [{ testCases: { $exists: false } }, { testCases: { $size: 0 } }]
            }).limit(5).select('title');
            samples.forEach(p => console.log(`- ${p.title}`));
        }

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

checkTestCases();
