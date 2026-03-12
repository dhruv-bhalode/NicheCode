
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
        const problems = await Problem.find({ description: /Constraints:/i });
        console.log(`Found ${problems.length} problems with "Constraints:" header.`);

        let updatedCount = 0;

        for (const p of problems) {
            const desc = p.description;
            // Use regex to find text between "Constraints:" and the next major section or end
            const match = desc.match(/Constraints:([\s\S]*?)(?=Follow-up:|Example |Note:|$)/i);

            if (!match || !match[1]) continue;

            const constraintsRaw = match[1].trim();
            if (!constraintsRaw) continue;

            // Split into lines, remove HTML, and clean
            const cleanedConstraints = constraintsRaw
                .split(/\r?\n/)
                .map(line => {
                    // Remove HTML tags
                    let cleaned = line.replace(/<[^>]*>/g, '').trim();
                    // Remove leading list markers (1., -, *, etc.) but preserve negatives in -10^9
                    cleaned = cleaned.replace(/^[ \t]*(?:\d+[\.\)\-]|[•\-\*])(?:\s+|$)/, '').trim();
                    return cleaned;
                })
                .filter(line => line.length > 0);

            if (cleanedConstraints.length > 0) {
                p.constraints = cleanedConstraints;
                await p.save();
                updatedCount++;
                if (updatedCount % 100 === 0) {
                    console.log(`Updated ${updatedCount} problems...`);
                }
            }
        }

        console.log(`Finished. Total updated: ${updatedCount}`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
