
import mongoose from 'mongoose';
import User from '../models/User.js';
import Problem from '../models/Problem.js';
import { updateUserRecommendations } from '../utils/recommendationEngine.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) { console.error("Missing MONGO_URI"); process.exit(1); }

async function verify() {
    try {
        await mongoose.connect(MONGO_URI);
        const userId = "9999999911112223"; // Test User

        let user = await User.findOne({ userId });
        if (!user) {
            console.log("Creating test user if missing...");
            // ... create logic or assume verify_recommendations.js ran
            // We'll just exit if missing as verify_rec ran previously
            console.error("Test user not found. Run verify_recommendations.js first.");
            process.exit(1);
        }

        // 1. Pick a problem that is high scoring (e.g. top of list)
        const top1Id = Array.from(user.recommendationScores.entries())
            .sort((a, b) => b[1] - a[1])[0][0];

        console.log(`Top 1 Problem ID: ${top1Id}`);

        // 2. Mark as Solved
        console.log("Marking as solved...");
        user.uniqueSolvedIds.push(top1Id);
        await user.save();

        // 3. Run Engine
        console.log("Running Engine...");
        await updateUserRecommendations(userId);

        // 4. Check Score
        user = await User.findOne({ userId });
        const newScore = user.recommendationScores.get(top1Id);
        console.log(`New Score for ${top1Id}: ${newScore}`);

        if (newScore === -1) {
            console.log("SUCCESS: Solved problem excluded (score -1).");
        } else {
            console.log("FAILURE: Solved problem still has high score.");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

verify();
