
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../server/.env') });

async function main() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const problemSchema = new mongoose.Schema({}, { collection: 'display-problems', strict: false });
        const Problem = mongoose.model('Problem', problemSchema);

        // Fetch 50 problems that either have string solutions or the placeholder
        // Fetch 100 problems that either have string solutions or the placeholder, and are not yet updated to object format
        const query = {
            $and: [
                {
                    $or: [
                        { optimalSolution: { $type: "string" } },
                        { optimalSolution: "AI will generate this..." }
                    ]
                },
                { optimalSolution: { $not: { $type: "object" } } } // Exclude problems where optimalSolution is already an object
            ]
        };

        const problems = await Problem.find(query).sort({ id: 1 }).limit(100);

        const data = problems.map(p => ({
            id: p.id,
            title: p.title,
            pythonCode: typeof p.optimalSolution === 'string' && p.optimalSolution !== "AI will generate this..." ? p.optimalSolution : null
        }));

        console.log("FETCH_BATCH_START");
        console.log(JSON.stringify(data, null, 2));
        console.log("FETCH_BATCH_END");

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
main();
