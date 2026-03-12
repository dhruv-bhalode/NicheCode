
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
    optimalSolution: String,
    bruteForceTimeComplexity: String,
    bruteForceSpaceComplexity: String,
    optimalTimeComplexity: String,
    optimalSpaceComplexity: String
}, { collection: 'display-problems', strict: false });

const Problem = mongoose.model('Problem', problemSchema);

async function check() {
    try {
        await mongoose.connect(MONGO_URI);
        const total = await Problem.countDocuments();

        const noSolution = await Problem.countDocuments({
            $or: [
                { optimalSolution: { $exists: false } },
                { optimalSolution: '' },
                { optimalSolution: 'AI will generate this...' }
            ]
        });

        const missingBFTime = await Problem.countDocuments({ bruteForceTimeComplexity: { $exists: false } });
        const missingBFSpace = await Problem.countDocuments({ bruteForceSpaceComplexity: { $exists: false } });
        const missingOptTime = await Problem.countDocuments({ optimalTimeComplexity: { $exists: false } });
        const missingOptSpace = await Problem.countDocuments({ optimalSpaceComplexity: { $exists: false } });

        console.log('Total problems:', total);
        console.log('Problems with no optimal solution:', noSolution);
        console.log('Missing bruteForceTimeComplexity:', missingBFTime);
        console.log('Missing bruteForceSpaceComplexity:', missingBFSpace);
        console.log('Missing optimalTimeComplexity:', missingOptTime);
        console.log('Missing optimalSpaceComplexity:', missingOptSpace);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

check();
