
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const GEMINI_API_KEY = process.env.GEMINI_API;

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        // The SDK might not have a direct listModels, but we can try to find it or use fetch
        console.log("Checking API key with a simple request...");
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("test");
        console.log("gemini-pro works!");
    } catch (err) {
        console.error("Error:", err.message);
    }
}

listModels();
