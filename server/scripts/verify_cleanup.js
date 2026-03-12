
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

const problemSchema = new mongoose.Schema({
    id: String
}, { collection: 'display-problems', strict: false });

const Problem = mongoose.model('Problem', problemSchema);

async function verify() {
    try {
        await mongoose.connect(MONGO_URI);

        const countInput = await Problem.countDocuments({ inputFormat: { $exists: true } });
        const countOutput = await Problem.countDocuments({ outputFormat: { $exists: true } });
        const countTopics = await Problem.countDocuments({ topics: { $exists: true } });
        const countTemplate = await Problem.countDocuments({ template: { $exists: true } });

        console.log('Verification Results:');
        console.log(`Documents with inputFormat: ${countInput}`);
        console.log(`Documents with outputFormat: ${countOutput}`);
        console.log(`Documents with topics: ${countTopics}`);
        console.log(`Documents with template: ${countTemplate}`);

        if (countInput === 0 && countOutput === 0 && countTopics === 0 && countTemplate === 0) {
            console.log('SUCCESS: All fields removed.');
        } else {
            console.log('FAILURE: Some fields still remain.');
        }

    } catch (err) {
        console.error('Error during verification:', err);
    } finally {
        await mongoose.disconnect();
    }
}

verify();
