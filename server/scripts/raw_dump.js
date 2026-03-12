import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('c:/VSCODE_CAPSTONE/Capstone_Phase2/server/.env') });

async function rawDump() {
    await mongoose.connect(process.env.MONGO_URI);
    const userId = "8907443241427236";
    const user = await mongoose.connection.db.collection('users').findOne({ userId });

    if (!user) {
        console.log("User not found");
        return;
    }

    console.log("--- RAW USER DUMP ---");
    console.log(`userId: ${user.userId}`);
    console.log(`uniqueSolvedIds: ${JSON.stringify(user.uniqueSolvedIds)}`);
    console.log(`uniqueAttemptedIds: ${JSON.stringify(user.uniqueAttemptedIds)}`);

    const scores = user.recommendationScores ? Object.fromEntries(user.recommendationScores) : {};
    const negative = Object.entries(user.recommendationScores || {})
        .filter(([id, score]) => score < 0);

    console.log(`Negative Scores in recommendationScores: ${JSON.stringify(negative)}`);

    // Check interactions
    const interactions = await mongoose.connection.db.collection('interactions').find({ userId }).toArray();
    console.log(`Total Interactions in DB: ${interactions.length}`);
    interactions.forEach(i => console.log(`- Prob: ${i.problemId}, Status: ${i.submissionStatus}`));

    await mongoose.disconnect();
}

rawDump();
