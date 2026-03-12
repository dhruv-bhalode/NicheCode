
import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;
const GEMINI_API_KEY = process.env.GEMINI_API;

if (!MONGO_URI) { console.error("Missing MONGO_URI"); process.exit(1); }

const problemSchema = new mongoose.Schema({}, { collection: 'display-problems', strict: false });
const Problem = mongoose.model('Problem', problemSchema);

const GITHUB_BASE = 'https://raw.githubusercontent.com/doocs/leetcode/main/solution';
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) : null;

function padId(id) {
    return id.toString().padStart(4, '0');
}

function getRangeFolder(id) {
    const num = parseInt(id);
    const startNum = Math.floor(num / 100) * 100;
    const endNum = startNum + 99;
    return `${startNum.toString().padStart(4, '0')}-${endNum.toString().padStart(4, '0')}`;
}

async function fetchFromGitHub(id, title, ext) {
    const paddedId = padId(id);
    const rangeFolder = getRangeFolder(id);
    const encodedTitle = encodeURIComponent(title).replace(/'/g, '%27');
    const filename = ext === 'cpp' ? 'Solution.cpp' : 'Solution.java';
    const url = `${GITHUB_BASE}/${rangeFolder}/${paddedId}.${encodedTitle}/${filename}`;

    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        return null;
    }
}

async function generateWithAI(doc, lang) {
    if (!model) return null;
    const prompt = `
    Problem Title: ${doc.title}
    Description: ${doc.description}
    Python Solution: ${doc.optimalSolution?.python || doc.optimalSolution}
    
    Provide a clean, optimal ${lang} version of this solution. 
    Just the code, no markdown.
    `;
    try {
        const result = await model.generateContent(prompt);
        return result.response.text().trim().replace(/```[a-z]*\n/g, '').replace(/```/g, '');
    } catch (e) {
        console.error(`AI fail for ${doc.title} (${lang}):`, e.message);
        return null;
    }
}

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

async function main() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB.");

        const problems = await Problem.find({});
        console.log(`Processing ${problems.length} problems...`);

        let count = 0;
        for (const doc of problems) {
            count++;
            let changed = false;

            // Step 1: Normalize optimalSolution structure if it's a string
            if (typeof doc.optimalSolution === 'string') {
                const pythonCode = doc.optimalSolution;
                doc.optimalSolution = { python: pythonCode };
                doc.markModified('optimalSolution');
                changed = true;
            }

            // Ensure it's an object now
            if (!doc.optimalSolution) doc.optimalSolution = {};

            // Step 2: Try GitHub for Missing C++ and Java
            if (!doc.optimalSolution.cpp) {
                const cpp = await fetchFromGitHub(doc.id, doc.title, 'cpp');
                if (cpp) {
                    doc.optimalSolution.cpp = cpp;
                    doc.markModified('optimalSolution');
                    changed = true;
                }
            }

            if (!doc.optimalSolution.java) {
                const java = await fetchFromGitHub(doc.id, doc.title, 'java');
                if (java) {
                    doc.optimalSolution.java = java;
                    doc.markModified('optimalSolution');
                    changed = true;
                }
            }

            // Step 3: AI Fallback (Disabled by default to avoid huge bills/rate limits unless needed)
            // Uncomment if you want to use AI for missing ones
            /*
            if (!doc.optimalSolution.cpp && model) {
                 const cpp = await generateWithAI(doc, 'C++');
                 if (cpp) { doc.optimalSolution.cpp = cpp; doc.markModified('optimalSolution'); changed = true; }
            }
            if (!doc.optimalSolution.java && model) {
                 const java = await generateWithAI(doc, 'Java');
                 if (java) { doc.optimalSolution.java = java; doc.markModified('optimalSolution'); changed = true; }
            }
            */

            if (changed) {
                await doc.save();
                process.stdout.write(`✅ [${count}/${problems.length}] Updated ${doc.title}\r`);
            } else {
                process.stdout.write(`⏭️ [${count}/${problems.length}] Skipping ${doc.title}\r`);
            }

            // Rate limit safety
            if (count % 10 === 0) await sleep(500);
        }

        console.log("\nMigration complete.");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
