
import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

const problemSchema = new mongoose.Schema({
    id: String, // Adjusted to String as per MongoDB inspection
    title: String,
    optimalSolution: String
}, { collection: 'display-problems', strict: false });

const Problem = mongoose.model('Problem', problemSchema);

const BASE_URL = 'https://raw.githubusercontent.com/doocs/leetcode/main/solution';

function padId(id) {
    return id.toString().padStart(4, '0');
}

function getRangeFolder(id) {
    const num = parseInt(id);
    const startNum = Math.floor(num / 100) * 100;
    const endNum = startNum + 99;
    return `${startNum.toString().padStart(4, '0')}-${endNum.toString().padStart(4, '0')}`;
}

async function fetchSolution(id, title) {
    const paddedId = padId(id);
    const rangeFolder = getRangeFolder(id);
    const encodedTitle = encodeURIComponent(title).replace(/'/g, '%27');

    const url = `${BASE_URL}/${rangeFolder}/${paddedId}.${encodedTitle}/Solution.py`;

    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        return null;
    }
}

async function main() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB.");

        const query = { optimalSolution: "AI will generate this..." };
        const total = await Problem.countDocuments(query);
        console.log(`Found ${total} placeholders to attempt with GitHub sync.`);

        const cursor = Problem.find(query).cursor();
        let successCount = 0;
        let failCount = 0;
        let count = 0;

        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            count++;
            if (!doc.id) {
                console.log(`[${count}/${total}] Skipping: Missing ID for ${doc.title}`);
                continue;
            }

            const solution = await fetchSolution(doc.id, doc.title);

            if (solution) {
                doc.optimalSolution = solution;
                await doc.save();
                successCount++;
                console.log(`[${count}/${total}] ✅ SUCCESS: ${doc.title}`);
            } else {
                console.log(`[${count}/${total}] ❌ FAILED: ${doc.title}`);
                failCount++;
            }
        }

        console.log(`\nPhase 1 Results: ${successCount} updated via GitHub, ${failCount} still need Gemini.`);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

main();
