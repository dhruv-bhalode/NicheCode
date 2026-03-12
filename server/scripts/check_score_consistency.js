import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('c:/VSCODE_CAPSTONE/Capstone_Phase2/server/.env') });

const UserSchema = new mongoose.Schema({
    userId: String,
    uniqueSolvedIds: [String],
    recommendationScores: { type: Map, of: Number }
});

const User = mongoose.model('User', UserSchema);

async function inspect() {
    await mongoose.connect(process.env.MONGO_URI);
    const userId = "8907443241427236";
    const user = await User.findOne({ userId });

    if (!user) {
        console.log("User not found");
        return;
    }

    console.log("--- User Inspection ---");
    console.log(`Solved Count: ${user.uniqueSolvedIds.length}`);

    const scores = Object.fromEntries(user.recommendationScores);
    const negativeScores = Object.entries(scores).filter(([id, score]) => score < 0);

    console.log(`\nNegative Scores Count: ${negativeScores.length}`);

    // Check if any negative score is NOT in uniqueSolvedIds
    const anomaly = negativeScores.filter(([id, score]) => !user.uniqueSolvedIds.includes(id));

    if (anomaly.length > 0) {
        console.log("\n!!! ANOMALY FOUND !!!");
        console.log("The following IDs have negative scores but are NOT in uniqueSolvedIds:");
        anomaly.forEach(([id, score]) => console.log(`ID: ${id}, Score: ${score}`));
    } else {
        console.log("\nConsistency Check: All negative scores are for solved problems.");
    }

    await mongoose.disconnect();
}

inspect();
