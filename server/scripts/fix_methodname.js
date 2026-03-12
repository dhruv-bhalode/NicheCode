import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixMethodName() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const Problem = mongoose.model('Problem', new mongoose.Schema({}, { strict: false, collection: 'display-problems' }));

        const result = await Problem.updateOne(
            { id: '2' },
            { $set: { methodName: 'addTwoNumbers' } }
        );

        console.log('Update result:', result);

        // Verify the update
        const problem = await Problem.findOne({ id: '2' });
        console.log('Problem 2 methodName is now:', problem.methodName);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixMethodName();
