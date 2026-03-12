
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

const problemSchema = new mongoose.Schema({
    id: String,
    bruteForceTimeComplexity: String,
    bruteForceSpaceComplexity: String,
    optimalTimeComplexity: String,
    optimalSpaceComplexity: String
}, { collection: 'display-problems', strict: false });

const Problem = mongoose.model('Problem', problemSchema);

async function applyComplexities(inputFile) {
    try {
        await mongoose.connect(MONGO_URI);
        const updates = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

        for (const [id, data] of Object.entries(updates)) {
            const result = await Problem.updateOne(
                { id: id },
                {
                    $set: {
                        bruteForceTimeComplexity: data.bruteForceTimeComplexity,
                        bruteForceSpaceComplexity: data.bruteForceSpaceComplexity,
                        optimalTimeComplexity: data.optimalTimeComplexity,
                        optimalSpaceComplexity: data.optimalSpaceComplexity
                    }
                }
            );
            if (result.matchedCount === 0) {
                console.log(`Could not find problem with ID ${id}`);
            } else if (result.modifiedCount > 0) {
                console.log(`Updated ID ${id}: ${result.modifiedCount} modified.`);
            } else {
                console.log(`ID ${id}: No changes made.`);
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

const args = process.argv.slice(2);
const inputFile = args[0];

if (!inputFile) {
    console.error('Usage: node apply_complexities.js <inputFile>');
    process.exit(1);
}

applyComplexities(inputFile);
