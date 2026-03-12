
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const BATCH_SIZE = 10;

async function main() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const problemSchema = new mongoose.Schema({}, { collection: 'display-problems', strict: false });
        const Problem = mongoose.model('Problem', problemSchema);

        const query = {
            optimalSolution: { $type: "string" },
            optimalSolution: { $ne: "AI will generate this..." }
        };

        const problems = await Problem.find(query).sort({ id: 1 }).limit(BATCH_SIZE);

        const data = problems.map(p => ({
            id: p.id,
            title: p.title,
            pythonCode: p.optimalSolution
        }));

        console.log("FETCHED_BATCH_1_START");
        console.log(JSON.stringify(data, null, 2));
        console.log("FETCHED_BATCH_1_END");

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
main();
