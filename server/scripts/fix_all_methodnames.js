import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Function to extract method name from Python template
function extractMethodNameFromTemplate(template) {
    if (!template) return null;

    // Match pattern: def methodName(self, ...):
    const match = template.match(/def\s+(\w+)\s*\(/);
    if (match && match[1] && match[1] !== '__init__') {
        return match[1];
    }

    return null;
}

async function fixAllMethodNames() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');

        const Problem = mongoose.model('Problem', new mongoose.Schema({}, { strict: false, collection: 'display-problems' }));

        // Find all problems with methodName = "__init__"
        const problemsToFix = await Problem.find({ methodName: '__init__' });

        console.log(`Found ${problemsToFix.length} problems to fix\n`);

        let fixedCount = 0;
        let failedCount = 0;
        const failed = [];

        for (const problem of problemsToFix) {
            // Try to extract from python template
            const pythonTemplate = problem.templates?.python || problem.template;
            const extractedMethod = extractMethodNameFromTemplate(pythonTemplate);

            if (extractedMethod) {
                await Problem.updateOne(
                    { _id: problem._id },
                    { $set: { methodName: extractedMethod } }
                );
                console.log(`✓ Fixed ID ${problem.id}: ${problem.title} -> methodName: ${extractedMethod}`);
                fixedCount++;
            } else {
                console.log(`✗ Failed ID ${problem.id}: ${problem.title} - Could not extract method name`);
                failed.push({ id: problem.id, title: problem.title });
                failedCount++;
            }
        }

        console.log(`\n\n=== SUMMARY ===`);
        console.log(`Total problems: ${problemsToFix.length}`);
        console.log(`Fixed: ${fixedCount}`);
        console.log(`Failed: ${failedCount}`);

        if (failed.length > 0) {
            console.log(`\nFailed problems:`);
            failed.forEach(p => console.log(`  - ID ${p.id}: ${p.title}`));
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixAllMethodNames();
