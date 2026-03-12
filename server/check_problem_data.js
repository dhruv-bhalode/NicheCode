import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

async function check() {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) throw new Error('MONGO_URI not found in .env');

        console.log('Connecting to database...');
        await mongoose.connect(mongoUri);

        const db = mongoose.connection.db;
        const targetCollection = 'display-problems';

        const count = await db.collection(targetCollection).countDocuments();
        console.log(`Collection "${targetCollection}" count: ${count}`);

        if (count > 0) {
            const initCount = await db.collection(targetCollection).countDocuments({ methodName: '__init__' });
            console.log(`  Problems with methodName "__init__": ${initCount}`);

            const missingOut = await db.collection(targetCollection).countDocuments({ 'testCases.output': '' });
            console.log(`  Problems with empty testCases[].output: ${missingOut}`);

            // In case the field name is different in the nested array
            const missingExpectedOut = await db.collection(targetCollection).countDocuments({ 'testCases.expected_output': '' });
            console.log(`  Problems with empty testCases[].expected_output: ${missingExpectedOut}`);

            const autoGen = await db.collection(targetCollection).countDocuments({ 'testCases.output': /Auto-generated/i });
            console.log(`  Problems with "Auto-generated" testCases[].output: ${autoGen}`);

            if (missingOut > 0 || autoGen > 0 || missingExpectedOut > 0) {
                const examples = await db.collection(targetCollection).find({
                    $or: [
                        { 'testCases.output': '' },
                        { 'testCases.expected_output': '' },
                        { 'testCases.output': /Auto-generated/i }
                    ]
                }).limit(5).toArray();
                console.log('Examples of missing/auto-gen data:');
                examples.forEach(e => console.log(`    - ${e.id}: ${e.title}`));
            }

            // Check Problem 2 specifically
            const p2 = await db.collection(targetCollection).findOne({ id: '2' });
            if (p2) {
                console.log('  --- Problem 2 Details ---');
                console.log('  methodName:', p2.methodName);
                if (p2.testCases && p2.testCases.length > 0) {
                    console.log('  p2 first testCase:', JSON.stringify(p2.testCases[0], null, 2));
                }
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

check();
