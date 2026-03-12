
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

async function listPlaceholders() {
    try {
        await mongoose.connect(MONGO_URI);
        const docs = await Problem.find({ optimalSolution: "AI will generate this..." }).limit(20);
        console.log(JSON.stringify(docs.map(d => ({ id: d.id, title: d.title })), null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

listPlaceholders();
