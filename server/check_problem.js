import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Problem from './models/Problem.js';

dotenv.config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const p = await Problem.findOne({ id: '1' });
        console.log('Problem ID 1:');
        console.log('Title:', p.title);
        console.log('Optimal Solution Languages:', p.optimalSolution.map(s => s.language));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
