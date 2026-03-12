
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

const problemSchema = new mongoose.Schema({
    optimalTimeComplexity: String
}, { collection: 'display-problems', strict: false });

const Problem = mongoose.model('Problem', problemSchema);

async function check() {
    try {
        await mongoose.connect(MONGO_URI);
        const total = await Problem.countDocuments();
        const refined = await Problem.countDocuments({
            optimalTimeComplexity: { $regex: /^O\(.*\)$/ }
        });
        const placeholder = await Problem.countDocuments({
            $or: [
                { optimalTimeComplexity: { $exists: false } },
                { optimalTimeComplexity: '' },
                { optimalTimeComplexity: 'AI will generate this...' }
            ]
        });

        console.log('Total:', total);
        console.log('Refined (O(...)):', refined);
        console.log('Placeholders/Missing:', placeholder);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

check();
