import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Enhanced function to extract method name from Python template
function extractMethodNameFromTemplate(template) {
    if (!template) return null;

    // Remove comments and get actual code
    const lines = template.split('\n');

    // Find the first non-comment, non-empty line with 'def '
    for (const line of lines) {
        const trimmed = line.trim();

        // Skip comments and empty lines
        if (trimmed.startsWith('#') || trimmed === '') continue;

        // Match pattern: def methodName(self, ...):
        const match = trimmed.match(/def\s+(\w+)\s*\(/);
        if (match && match[1] && match[1] !== '__init__') {
            return match[1];
        }
    }

    return null;
}

async function fixAllMethodNamesEnhanced() {
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
                failed.push({ id: problem.id, title: problem.title, template: pythonTemplate?.substring(0, 200) });
                failedCount++;
            }
        }

        console.log(`\n\n=== SUMMARY ===`);
        console.log(`Total problems: ${problemsToFix.length}`);
        console.log(`Fixed: ${fixedCount}`);
        console.log(`Failed: ${failedCount}`);

        if (failed.length > 0 && failed.length <= 10) {
            console.log(`\nFailed problems (showing templates):`);
            failed.forEach(p => {
                console.log(`\n  - ID ${p.id}: ${p.title}`);
                console.log(`    Template: ${p.template}`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixAllMethodNamesEnhanced();
