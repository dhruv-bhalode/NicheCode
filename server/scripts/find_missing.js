
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

const problemSchema = new mongoose.Schema({
    id: String,
    title: String,
    optimalSolution: String
}, { collection: 'display-problems', strict: false });

const Problem = mongoose.model('Problem', problemSchema);

async function find() {
    try {
        await mongoose.connect(MONGO_URI);
        const doc = await Problem.findOne({
            $or: [
                { optimalSolution: { $exists: false } },
                { optimalSolution: '' },
                { optimalSolution: 'AI will generate this...' }
            ]
        });
        if (doc) {
            console.log('MISSING_SOLUTION:', JSON.stringify({ id: doc.id, title: doc.title }));
        } else {
            console.log('MISSING_SOLUTION: None');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

find();
