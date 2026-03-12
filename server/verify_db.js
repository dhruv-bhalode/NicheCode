
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../server/.env') });

async function main() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const problemSchema = new mongoose.Schema({}, { collection: 'display-problems', strict: false });
        const Problem = mongoose.model('Problem', problemSchema);

        const twoSum = await Problem.findOne({ title: "Two Sum" });
        if (twoSum) {
            console.log("Two Sum Found:");
            console.log("optimalSolution type:", typeof twoSum.optimalSolution);
            console.log("is Array:", Array.isArray(twoSum.optimalSolution));
            console.log("Value:", JSON.stringify(twoSum.optimalSolution, null, 2));
        } else {
            console.log("Two Sum not found.");
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
main();
