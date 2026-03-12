
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
    topics: mongoose.Schema.Types.Mixed // Use Mixed to see raw structure
}, { collection: 'display-problems' });

const Problem = mongoose.model('Problem', problemSchema);

async function main() {
    try {
        await mongoose.connect(MONGO_URI);

        // Check a few different IDs
        const ids = [1, 100, 205, 1000];

        for (const id of ids) {
            const doc = await Problem.findOne({ id });
            if (doc) {
                console.log(`ID ${id}:`, JSON.stringify(doc.topics, null, 2));
            } else {
                console.log(`ID ${id}: Not found`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

main();
