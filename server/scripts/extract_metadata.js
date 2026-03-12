
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

const problemSchema = new mongoose.Schema({
    id: String,
    title: String,
    description: String,
    constraints: [String],
    testCases: Array
}, { collection: 'display-problems', strict: false });

const Problem = mongoose.model('Problem', problemSchema);

async function getProblemMetadata() {
    try {
        await mongoose.connect(MONGO_URI);
        const problems = await Problem.find({ optimalSolution: "AI will generate this..." }).limit(70);
        console.log(JSON.stringify(problems, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

getProblemMetadata();
