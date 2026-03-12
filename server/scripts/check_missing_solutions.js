import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkMissingSolutions() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const problemSchema = new mongoose.Schema({}, { collection: 'display-problems', strict: false });
        const Problem = mongoose.model('Problem', problemSchema);

        const problems = await Problem.find({}).lean();
        let missingCount = 0;

        for (let p of problems) {
            if (!p.optimalSolution || typeof p.optimalSolution !== 'string' || p.optimalSolution.includes('AI will generate this')) {
                missingCount++;
                if (missingCount <= 2) {
                    console.log(`Example missing problem: ${p.titleSlug}`);
                    console.log(`Available fields: ${Object.keys(p).join(', ')}`);
                }
            }
        }
        console.log(`Total missing optimalSolutions: ${missingCount}`);
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
checkMissingSolutions();
