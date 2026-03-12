import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('c:/VSCODE_CAPSTONE/Capstone_Phase2/server/.env') });

async function checkScore() {
    await mongoose.connect(process.env.MONGO_URI);
    const userId = "8907443241427236";
    const user = await mongoose.connection.db.collection('users').findOne({ userId });

    if (!user) {
        console.log("User not found");
        return;
    }

    const scores = user.recommendationScores ? Object.fromEntries(user.recommendationScores) : {};
    const score1 = scores["1"];
    const isSolved = user.uniqueSolvedIds.includes("1");

    console.log(`Problem 1 - Score: ${score1}, Solved: ${isSolved}`);

    await mongoose.disconnect();
}

checkScore();
