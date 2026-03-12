
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;
const GEMINI_API_KEY = process.env.GEMINI_API;

if (!MONGO_URI || !GEMINI_API_KEY) {
    console.error("Missing credentials");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const problemSchema = new mongoose.Schema({
    title: String,
    description: String,
    optimalSolution: String
}, { collection: 'display-problems', strict: false });

const Problem = mongoose.model('Problem', problemSchema);

async function testOne() {
    try {
        await mongoose.connect(MONGO_URI);
        const problem = await Problem.findOne({ optimalSolution: "AI will generate this..." });

        if (!problem) {
            console.log("No placeholders left!");
            return;
        }

        console.log(`TESTING: ${problem.title}`);
        const prompt = `Provide the optimal Python solution for: ${problem.title}\nDescription: ${problem.description}\nReturn as JSON: {"optimalSolution": "..."}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        console.log("SUCCESS! API responded.");
        console.log(response.text().substring(0, 100));

    } catch (err) {
        console.error("STILL FAILING:", err.message);
    } finally {
        await mongoose.disconnect();
    }
}

testOne();
