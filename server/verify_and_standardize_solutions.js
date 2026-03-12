
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

        const allProblems = await Problem.find({});
        console.log(`Found ${allProblems.length} problems total.`);

        let updatedCount = 0;
        const requiredLanguages = ['python', 'cpp', 'java'];

        for (const problem of allProblems) {
            let solutions = [];
            let modified = false;

            if (typeof problem.optimalSolution === 'string') {
                // Recover legacy string as python solution if it's not the generic placeholder
                if (problem.optimalSolution !== "AI will generate this...") {
                    solutions.push({ language: 'python', code: problem.optimalSolution });
                }
                modified = true;
            } else if (Array.isArray(problem.optimalSolution)) {
                solutions = [...problem.optimalSolution];
            }

            const existingLanguages = new Set(solutions.map(s => s.language));

            for (const lang of requiredLanguages) {
                if (!existingLanguages.has(lang)) {
                    solutions.push({ language: lang, code: "" });
                    modified = true;
                }
            }

            // Also check for null or undefined codes and fix them to ""
            for (const sol of solutions) {
                if (sol.code === null || sol.code === undefined) {
                    sol.code = "";
                    modified = true;
                }
            }

            if (modified) {
                await Problem.updateOne({ _id: problem._id }, { $set: { optimalSolution: solutions } });
                updatedCount++;
                if (updatedCount % 100 === 0) {
                    console.log(`Updated ${updatedCount} problems so far...`);
                }
            }
        }

        console.log(`Finalization complete. Total problems updated: ${updatedCount}`);
    } catch (e) {
        console.error("Error during verification:", e);
    } finally {
        await mongoose.disconnect();
    }
}

main();
