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

async function checkInteractions() {
    await mongoose.connect(process.env.MONGO_URI);
    const userId = "8907443241427236";
    const problemId = "213";

    const interactions = await Interaction.find({ userId, problemId }).sort({ createdAt: -1 });

    console.log(`--- Interaction History for User ${userId}, Problem ${problemId} ---`);
    if (interactions.length === 0) {
        console.log("No interactions found.");
    } else {
        interactions.forEach(i => {
            console.log(`[${i.createdAt.toISOString()}] Status: ${i.submissionStatus === 1 ? 'CORRECT' : 'FAILED'}`);
        });
    }

    await mongoose.disconnect();
}

checkInteractions();
