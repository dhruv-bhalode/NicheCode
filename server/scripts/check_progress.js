
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
    timeComplexity: String
}, { collection: 'display-problems' });

const Problem = mongoose.model('Problem', problemSchema);

async function checkProgress() {
    try {
        await mongoose.connect(MONGO_URI);

        const total = await Problem.countDocuments({});
        const updated = await Problem.countDocuments({
            optimalSolution: { $ne: "AI will generate this..." },
            timeComplexity: { $exists: true }
        });

        const pending = total - updated;

        console.log(`Total Problems: ${total}`);
        console.log(`Updated: ${updated}`);
        console.log(`Pending: ${pending}`);
        console.log(`Progress: ${((updated / total) * 100).toFixed(2)}%`);

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

checkProgress();
