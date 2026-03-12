import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function importSolutions() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const problemSchema = new mongoose.Schema({}, { collection: 'display-problems', strict: false });
        const Problem = mongoose.model('Problem', problemSchema);

        const data = JSON.parse(fs.readFileSync('./exports/display-problems.json', 'utf-8'));

        let count = 0;
        console.log("Checking for updates to apply to DB...");

        for (let p of data) {
            if (!p.optimalSolution || !Array.isArray(p.optimalSolution)) continue;

            const py_code = p.optimalSolution.find(s => s.language === 'python')?.code || "";
            const is_dummy = py_code.includes("    pass\n") || py_code.trim() === "";

            if (!is_dummy) {
                await Problem.updateOne(
                    { id: p.id || p.questionFrontendId },
                    { $set: { optimalSolution: p.optimalSolution } }
                );
                count++;
            }
        }

        console.log(`Successfully updated ${count} real solutions in the database.`);
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

importSolutions();
