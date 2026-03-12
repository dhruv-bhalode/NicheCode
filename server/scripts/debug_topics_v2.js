
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

const problemSchema = new mongoose.Schema({
    title: String,
    topics: mongoose.Schema.Types.Mixed
}, { collection: 'display-problems' });

const Problem = mongoose.model('Problem', problemSchema);

async function main() {
    try {
        await mongoose.connect(MONGO_URI);

        const cursor = Problem.find({}).cursor();
        let count = 0;

        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            count++;
            if (count % 500 === 0) {
                console.log(`Title: ${doc.title}`);
                console.log(`Topics:`, JSON.stringify(doc.topics));
                console.log(`Tags:`, JSON.stringify(doc.tags));
                console.log('---');
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

main();
