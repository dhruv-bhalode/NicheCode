
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

const problemSchema = new mongoose.Schema({
    title: String,
    description: String,
    optimalSolution: String
}, { collection: 'display-problems' });

const Problem = mongoose.model('Problem', problemSchema);

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function main() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB.");

        const query = {
            $or: [
                { optimalSolution: "AI will generate this..." },
                { optimalSolution: { $exists: false } }
            ]
        };

        const count = await Problem.countDocuments(query);
        console.log(`Count: ${count}`);

        const doc = await Problem.findOne(query);
        if (!doc) {
            console.log("No document found!");
            return;
        }

        console.log(`Found doc: ${doc.title}`);
        console.log(`Description length: ${doc.description?.length}`);

        console.log("Generating solution...");
        const result = await model.generateContent([
            "Generate a JSON with optimalSolution (python code), timeComplexity, spaceComplexity for:",
            `Title: ${doc.title}\nDescription: ${doc.description}`
        ]);

        console.log("Gemini Response:");
        console.log(result.response.text());

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

main();
