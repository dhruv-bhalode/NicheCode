
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    if (!process.env.GEMINI_API) {
        console.error("No GEMINI_API found in .env");
        return;
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);
    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

    for (const modelName of models) {
        try {
            console.log(`Testing ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say hello");
            console.log(`Success with ${modelName}:`, result.response.text());
            return;
        } catch (e) {
            console.error(`Failed with ${modelName}:`, e.message);
        }
    }
}
main();
