
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
    description: String,
    constraints: Array
}, { collection: 'display-problems', strict: false });

const Problem = mongoose.model('Problem', problemSchema);

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        const missing = await Problem.find({
            $or: [
                { constraints: { $exists: false } },
                { constraints: { $size: 0 } }
            ]
        }, { id: 1, title: 1, description: 1 });

        console.log(`TOTAL_MISSING: ${missing.length}`);

        const nonSqlMissing = missing.filter(p => !p.description.includes('Table:'));
        console.log(`NON_SQL_MISSING: ${nonSqlMissing.length}`);

        nonSqlMissing.slice(0, 20).forEach(p => {
            console.log(`${p.id}: ${p.title}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
