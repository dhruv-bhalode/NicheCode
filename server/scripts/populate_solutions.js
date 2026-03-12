
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Configuration
const MONGO_URI = process.env.MONGO_URI;
const GEMINI_API_KEY = process.env.GEMINI_API;
const BASE_DELAY_MS = 20000; // 20 seconds baseline delay

if (!MONGO_URI || !GEMINI_API_KEY) {
    console.error("Missing MONGO_URI or GEMINI_API in .env");
    process.exit(1);
}

const SYSTEM_PROMPT = `
You are an expert coding interview assistant. 
For the given coding problem, provide the following in strictly valid JSON format:
1. "optimalSolutions": An array of objects, each containing:
   - "language": One of "python", "cpp", "java", "javascript".
   - "code": A clean, well-commented solution in that language.
2. "timeComplexity": The Big O time complexity (e.g., "O(n)").
3. "spaceComplexity": The Big O space complexity (e.g., "O(1)").

Do NOT include Markdown formatting (like \`\`\`json). Just the raw JSON string.
`;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT
});

// Define Schema
const problemSchema = new mongoose.Schema({}, { collection: 'display-problems', strict: false });
const Problem = mongoose.model('Problem', problemSchema);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function generateSolutionWithRetry(doc, retries = 5) {
    for (let i = 0; i < retries; i++) {
        try {
            const prompt = `
            Problem Title: ${doc.title}
            Description: ${doc.description}
            Constraints: ${JSON.stringify(doc.constraints || [])}
            Test Cases: ${JSON.stringify(doc.testCases || [])}

            Provide the optimal solutions in Python, C++, and Java, along with their complexities.
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();

            console.log(`  -> 🟢 Raw AI Response for "${doc.title}":`, text.substring(0, 100) + "...");

            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedData = JSON.parse(text);

            if (!parsedData.optimalSolutions || !Array.isArray(parsedData.optimalSolutions)) {
                console.error("  -> ❌ Invalid JSON structure (missing optimalSolutions array)");
                return null;
            }

            return parsedData;
        } catch (error) {
            console.error(`  -> ❌ Attempt ${i + 1} Error:`, error.message);
            const isRateLimit = error.status === 429 || error.message.includes('429');
            if (isRateLimit) {
                const waitTime = (i + 1) * 30000; // 30s, 60s, 90s, 120s, 150s
                console.warn(`  !! Rate limit (429) hit for "${doc.title}". Cooling down for ${waitTime / 1000}s (Attempt ${i + 1}/${retries})...`);
                await sleep(waitTime);
            } else {
                console.error(`  !! Error for "${doc.title}":`, error.message);
                return null;
            }
        }
    }
    return null;
}

async function main() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB.");

        // Update query to include problems with legacy string solutions or the placeholder
        const query = {
            $or: [
                { optimalSolution: "AI will generate this..." },
                { optimalSolution: { $type: "string" } }
            ]
        };
        const total = await Problem.countDocuments(query);
        console.log(`Starting Phase 2: Processing ${total} problems needing multi-lang solutions.`);

        const cursor = Problem.find(query).cursor();
        let count = 0;
        let success = 0;

        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            count++;

            // Skip Two Sum if it already has data or handle it specially if requested, 
            // but for now let's just process all that match the query.
            console.log(`[${count}/${total}] AI Generating Solution: ${doc.title}`);

            const data = await generateSolutionWithRetry(doc);

            if (data && data.optimalSolutions) {
                doc.optimalSolution = data.optimalSolutions;
                doc.timeComplexity = data.timeComplexity;
                doc.spaceComplexity = data.spaceComplexity;
                doc.optimalTimeComplexity = data.timeComplexity;
                doc.optimalSpaceComplexity = data.spaceComplexity;

                await doc.save();
                success++;
                console.log(`  -> ✅ Saved: ${data.timeComplexity}, ${data.spaceComplexity}`);
            } else {
                console.log(`  -> ❌ Skipping after retries or missing data.`);
            }

            // Standard safety delay between successful calls
            await sleep(BASE_DELAY_MS);
        }

        console.log(`\nPhase 2 Finished! Updated ${success}/${total} problems.`);

    } catch (error) {
        console.error("Fatal Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

main();
