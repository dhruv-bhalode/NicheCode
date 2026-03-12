
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
    optimalTimeComplexity: String
}, { collection: 'display-problems', strict: false });

const Problem = mongoose.model('Problem', problemSchema);

async function check() {
    try {
        await mongoose.connect(MONGO_URI);
        const remaining = await Problem.find({
            $or: [
                { optimalTimeComplexity: { $exists: false } },
                { optimalTimeComplexity: '' },
                { optimalTimeComplexity: 'AI will generate this...' }
            ]
        }, { id: 1, title: 1 }).sort({ id: 1 });

        console.log('TOTAL_REMAINING:' + remaining.length);
        remaining.slice(0, 100).forEach(p => console.log(`${p.id}: ${p.title}`));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

check();
