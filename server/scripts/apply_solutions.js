
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

const problemSchema = new mongoose.Schema({}, { collection: 'display-problems', strict: false });
const Problem = mongoose.model('Problem', problemSchema);

async function applySolutions() {
    try {
        await mongoose.connect(MONGO_URI);
        const solutions = JSON.parse(fs.readFileSync('solutions_batch_8.json', 'utf8'));

        for (const [id, data] of Object.entries(solutions)) {
            const result = await Problem.updateOne(
                { id: id },
                {
                    $set: {
                        optimalSolution: data.optimalSolution,
                        timeComplexity: data.timeComplexity,
                        spaceComplexity: data.spaceComplexity,
                        optimalTimeComplexity: data.timeComplexity,
                        optimalSpaceComplexity: data.spaceComplexity
                    }
                }
            );
            console.log(`Updated ID ${id}: ${result.modifiedCount} modified.`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

applySolutions();
