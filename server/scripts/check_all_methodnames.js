import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkAllMethodNames() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const Problem = mongoose.model('Problem', new mongoose.Schema({}, { strict: false, collection: 'display-problems' }));

        // Find all problems with methodName = "__init__"
        const problemsWithInitMethod = await Problem.find({ methodName: '__init__' });

        console.log(`\nFound ${problemsWithInitMethod.length} problems with methodName = "__init__":\n`);

        problemsWithInitMethod.forEach(p => {
            console.log(`ID: ${p.id}, Title: ${p.title}, methodName: ${p.methodName}`);
        });

        // Also check for any null or undefined methodNames
        const problemsWithoutMethod = await Problem.find({
            $or: [
                { methodName: null },
                { methodName: { $exists: false } }
            ]
        }).limit(10);

        console.log(`\n\nFound ${problemsWithoutMethod.length} problems without methodName (showing first 10):\n`);

        problemsWithoutMethod.forEach(p => {
            console.log(`ID: ${p.id}, Title: ${p.title}, methodName: ${p.methodName}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAllMethodNames();
