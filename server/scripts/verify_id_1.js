
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

const problemSchema = new mongoose.Schema({
    id: Number,
    title: String,
    optimalSolution: String
}, { collection: 'display-problems' });

const Problem = mongoose.model('Problem', problemSchema);

async function verify() {
    try {
        await mongoose.connect(MONGO_URI);
        const p = await Problem.findOne({ title: "Two Sum" });
        console.log("Found document:", p);
        if (p && p.optimalSolution) {
            console.log("SUCCESS: ID 1 has optimalSolution.");
            console.log("--- START PREVIEW ---");
            console.log(p.optimalSolution.substring(0, 200));
            console.log("--- END PREVIEW ---");
        } else {
            console.log("FAILURE: ID 1 missing optimalSolution.");
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

verify();
