import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('c:/VSCODE_CAPSTONE/Capstone_Phase2/server/.env') });

const InteractionSchema = new mongoose.Schema({
    userId: String,
    problemId: String,
    submissionStatus: Number,
    createdAt: Date
});

const Interaction = mongoose.model('Interaction', InteractionSchema);

async function dumpAllInteractions() {
    await mongoose.connect(process.env.MONGO_URI);
    const userId = "8907443241427236";
    const interactions = await Interaction.find({ userId }).sort({ createdAt: 1 });

    console.log(`User ${userId} - Total Interactions: ${interactions.length}`);
    interactions.forEach(i => {
        console.log(`- [${i.createdAt.toISOString()}] Prob: ${i.problemId} | Status: ${i.submissionStatus === 1 ? 'CORRECT' : 'FAILED'}`);
    });

    await mongoose.disconnect();
}

dumpAllInteractions();
