
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
    optimalSolution: String
}, { collection: 'display-problems' });

const Problem = mongoose.model('Problem', problemSchema);

async function checkPlaceholders() {
    try {
        await mongoose.connect(MONGO_URI);

        const total = await Problem.countDocuments({});
        const placeholders = await Problem.countDocuments({
            optimalSolution: "AI will generate this..."
        });

        console.log(`Total Problems: ${total}`);
        console.log(`Problems with Placeholder: ${placeholders}`);

        if (placeholders > 0) {
            console.log("\nSample problems with placeholder:");
            const samples = await Problem.find({
                optimalSolution: "AI will generate this..."
            }).limit(5).select('title');
            samples.forEach(p => console.log(`- ${p.title}`));
        }

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

checkPlaceholders();
