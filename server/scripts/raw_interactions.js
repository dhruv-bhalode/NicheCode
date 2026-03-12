import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('c:/VSCODE_CAPSTONE/Capstone_Phase2/server/.env') });

async function rawInteractions() {
    await mongoose.connect(process.env.MONGO_URI);
    const userId = "8907443241427236";
    const interactions = await mongoose.connection.db.collection('interactions').find({ userId }).toArray();

    console.log(`User ${userId} - Raw Interactions (${interactions.length}):`);
    interactions.forEach(i => {
        console.log(`- ID: ${i._id} | Prob: ${i.problemId} (${typeof i.problemId}) | Status: ${i.submissionStatus} | Created: ${i.createdAt}`);
    });

    await mongoose.disconnect();
}

rawInteractions();
