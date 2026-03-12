
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const problemSchema = new mongoose.Schema({
    id: Number,
    title: String,
    optimalTimeComplexity: String,
    optimalSpaceComplexity: String,
    bruteForceTimeComplexity: String,
    bruteForceSpaceComplexity: String
}, { collection: 'display-problems' });

const Problem = mongoose.model('Problem', problemSchema);

async function generateComplexity(title) {
    const prompt = `Analyze the LeetCode problem "${title}".
    Provide the Time and Space complexity for both a Brute Force approach and an Optimal approach.
    Return ONLY valid JSON in this format:
    {
        "bruteForce": { "time": "O(...)", "space": "O(...)" },
        "optimal": { "time": "O(...)", "space": "O(...)" }
    }
    Do not include markdown formatting or explanations.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);
    } catch (error) {
        console.error(`Error generating for ${title}:`, error.message);
        return null;
    }
}

async function main() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB.");

        const cursor = Problem.find({
            $or: [
                { bruteForceTimeComplexity: { $exists: false } },
                { optimalTimeComplexity: { $exists: false } }
            ]
        }).sort({ id: 1 }).cursor();

        let successCount = 0;

        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            if (!doc.title) continue;

            process.stdout.write(`Analyzing ID ${doc.id}: ${doc.title}... `);

            const data = await generateComplexity(doc.title);

            if (data && data.bruteForce && data.optimal) {
                doc.bruteForceTimeComplexity = data.bruteForce.time;
                doc.bruteForceSpaceComplexity = data.bruteForce.space;
                doc.optimalTimeComplexity = data.optimal.time;
                doc.optimalSpaceComplexity = data.optimal.space;

                await doc.save();
                console.log("UPDATED");
                successCount++;
            } else {
                console.log("FAILED to generate/parse.");
            }

            // Rate limit: 4 seconds delay => 15 req/min
            await new Promise(r => setTimeout(r, 4000));
        }

        console.log(`\nFinished. updated ${successCount} problems.`);

    } catch (error) {
        console.error("Fatal Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

main();
