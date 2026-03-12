import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('c:/VSCODE_CAPSTONE/Capstone_Phase2/server/.env') });

const UserSchema = new mongoose.Schema({ userId: String, recommendationScores: { type: Map, of: Number }, uniqueSolvedIds: [String] });
const User = mongoose.model('User', UserSchema);

async function dumpNegative() {
    await mongoose.connect(process.env.MONGO_URI);
    const userId = "8907443241427236";
    const user = await User.findOne({ userId });

    if (!user) {
        console.log("User not found");
        return;
    }

    const scores = Object.fromEntries(user.recommendationScores);
    const negative = Object.entries(scores)
        .filter(([id, score]) => score < 0)
        .sort((a, b) => a[1] - b[1]);

    const problemColl = mongoose.connection.db.collection('display-problems');

    console.log(`User ${userId} - All Negative Scores (${negative.length}):`);
    for (const [id, score] of negative) {
        const prob = await problemColl.findOne({ id: id });
        const solvedStatus = user.uniqueSolvedIds.includes(id) ? "SOLVED" : "NOT SOLVED";
        console.log(`- [${id}] ${prob ? prob.title : 'Unknown'} | Score: ${score} | Status: ${solvedStatus}`);
    }

    await mongoose.disconnect();
}

dumpNegative();
