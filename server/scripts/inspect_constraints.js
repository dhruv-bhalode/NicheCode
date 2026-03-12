
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

async function inspect() {
    try {
        await mongoose.connect(MONGO_URI);
        const samples = await Problem.find({ description: { $exists: true } }).limit(10);

        for (const p of samples) {
            console.log(`ID: ${p.id}`);
            console.log(`TITLE: ${p.title}`);
            console.log('--- DESCRIPTION START ---');
            console.log(p.description);
            console.log('--- DESCRIPTION END ---');
            console.log(`CONSTRAINTS: ${JSON.stringify(p.constraints)}`);
            console.log('=========================================');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

inspect();
