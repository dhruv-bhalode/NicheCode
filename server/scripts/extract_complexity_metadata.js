
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
    title: String,
    description: String,
    optimalSolution: String
}, { collection: 'display-problems', strict: false });

const Problem = mongoose.model('Problem', problemSchema);

async function extractMetadata(offset, limit, outputFile) {
    try {
        await mongoose.connect(MONGO_URI);
        const problems = await Problem.find({}).skip(offset).limit(limit).select('id title description optimalSolution');
        fs.writeFileSync(outputFile, JSON.stringify(problems, null, 2));
        console.log(`Extracted ${problems.length} problems to ${outputFile}`);
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

const args = process.argv.slice(2);
const offset = parseInt(args[0]) || 0;
const limit = parseInt(args[1]) || 100;
const outputFile = args[2] || 'metadata_complexity.json';

extractMetadata(offset, limit, outputFile);
