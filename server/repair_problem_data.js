import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

async function repair() {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) throw new Error('MONGO_URI not found in .env');

        console.log('Connecting to database...');
        await mongoose.connect(mongoUri);

        const db = mongoose.connection.db;
        const collection = db.collection('display-problems');

        const problems = await collection.find({}).toArray();
        console.log(`Processing ${problems.length} problems...`);

        let updatedCount = 0;
        let methodNameFixes = 0;
        let testCaseFixes = 0;

        for (const p of problems) {
            let needsUpdate = false;
            let updateFields = {};

            // 1. Fix methodName if it's __init__ (or if we can find a better one)
            const pythonTemplate = p.templates?.python || p.template;
            if (pythonTemplate) {
                const lines = pythonTemplate.split('\n');
                const cleanLines = lines.filter(l => !l.trim().startsWith('#'));
                const cleanTemplate = cleanLines.join('\n');

                // Find ALL methods and pick the first one that isn't __init__
                const methodMatches = [...cleanTemplate.matchAll(/def\s+(\w+)\(/g)];
                let foundMethod = null;
                for (const m of methodMatches) {
                    if (m[1] !== '__init__') {
                        foundMethod = m[1];
                        break;
                    }
                }

                if (foundMethod && foundMethod !== p.methodName) {
                    updateFields.methodName = foundMethod;
                    needsUpdate = true;
                    methodNameFixes++;
                }
            }

            // 2. Fix testCases if they are empty, "Auto-generated", have leading colons, or contain "Explanation" in output
            const hasEmptyOutput = p.testCases && p.testCases.some(tc => tc.output === "" || !tc.output);
            const isAutoGen = p.testCases && p.testCases.some(tc => tc.explanation === "Auto-generated test case");
            const hasLeadingColon = p.testCases && p.testCases.some(tc => tc.input?.trim().startsWith(':') || tc.output?.trim().startsWith(':'));
            const hasCorruptedOutput = p.testCases && p.testCases.some(tc => tc.output?.includes("Explanation"));

            if (hasEmptyOutput || isAutoGen || hasLeadingColon || hasCorruptedOutput || !p.testCases || p.testCases.length === 0) {
                const description = p.description || "";

                // Robust regex for multi-line examples - handles optional colon and prevents overflow into Explanation
                const examplePattern = /Example \d+:[\s\S]*?(?:Input:?)\s*([\s\S]*?)\s*(?:Output:?)\s*([\s\S]*?)(?:\s*(?:Explanation:?)\s*([\s\S]*?))?\s*(?=Example \d+|Constraints|$)/gi;
                let m;
                const newTestCases = [];

                while ((m = examplePattern.exec(description)) !== null) {
                    newTestCases.push({
                        input: m[1].trim(),
                        output: m[2].trim(),
                        explanation: m[3] ? m[3].trim() : ""
                    });
                }

                if (newTestCases.length > 0) {
                    updateFields.testCases = newTestCases;
                    needsUpdate = true;
                    testCaseFixes++;
                }
            }

            if (needsUpdate) {
                await collection.updateOne({ _id: p._id }, { $set: updateFields });
                updatedCount++;
                if (updatedCount % 100 === 0) console.log(`Updated ${updatedCount} problems...`);
            }
        }

        console.log('--- Repair Summary ---');
        console.log(`Total problems updated: ${updatedCount}`);
        console.log(`MethodName fixes: ${methodNameFixes}`);
        console.log(`TestCase fixes: ${testCaseFixes}`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

repair();
