import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') }); // FIXED: Added '../' to reach server root

async function deleteTestProblemStats() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const problemSchema = new mongoose.Schema({}, { collection: 'display-problems', strict: false });
        const Problem = mongoose.model('Problem', problemSchema);

        // Find and delete the problem
        const result = await Problem.deleteOne({ title: 'Test Problem Stats' });

        if (result.deletedCount === 1) {
            console.log("Successfully deleted 'Test Problem Stats' from the database.");
        } else {
            console.log("Could not find 'Test Problem Stats' in the database (or it might have been deleted already).");
        }

        // Export updated list to display-problems.json
        const updatedProblems = await Problem.find({}).lean();
        fs.writeFileSync('../exports/display-problems.json', JSON.stringify(updatedProblems, null, 2), 'utf-8'); // FIXED: added '../'
        console.log(`Updated exports/display-problems.json. Remaining problems: ${updatedProblems.length}`);

    } catch (e) {
        console.error("Error during deletion:", e);
    } finally {
        await mongoose.disconnect();
    }
}

deleteTestProblemStats();
