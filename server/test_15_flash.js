
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../server/.env') });

async function main() {
    if (!process.env.GEMINI_API) {
        console.error("No GEMINI_API found in .env");
        return;
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);
    const modelName = "gemini-1.5-flash";

    try {
        console.log(`Testing ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Respond with 'OK' if you can hear me.");
        console.log(`Success: ${result.response.text().trim()}`);
    } catch (e) {
        console.error(`Failed with ${modelName}:`, e.message);
    }
}
main();
