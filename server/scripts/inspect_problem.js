import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function inspectProblem() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');

        const Problem = mongoose.model('Problem', new mongoose.Schema({}, { strict: false, collection: 'display-problems' }));

        // Get problem ID 2 (Add Two Numbers) to see its template
        const problem = await Problem.findOne({ id: '2' });

        console.log('Problem ID:', problem.id);
        console.log('Title:', problem.title);
        console.log('\nPython Template:');
        console.log(problem.templates?.python || problem.template);
        console.log('\n\nCurrent methodName:', problem.methodName);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

inspectProblem();
