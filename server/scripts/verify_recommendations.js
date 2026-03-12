
import mongoose from 'mongoose';
import User from '../models/User.js';
import Problem from '../models/Problem.js';
import { updateUserRecommendations } from '../utils/recommendationEngine.js';
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) { console.error("Missing MONGO_URI"); process.exit(1); }

async function verify() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB.");

        // 1. Create/Find Test User
        const userId = "9999999911112223";
        await User.deleteOne({ userId }); // Clean slate

        const user = new User({
            name: "Rec Test User",
            email: "rectest@example.com",
            userId: userId,
            userRating: 1500, // Medium target
            experience: "Intermediate",
            skillDistribution: [
                { name: "Dynamic Porgramming", level: 0.9 }, // Strong
                { name: "Trees", level: 0.1 } // Weak
            ],
            preferredCompanies: { "Google": 5, "Amazon": 1 }, // Google Preferred
        });
        await user.save();
        console.log("Test User Created.");

        // 2. Run Recommendation Engine
        console.log("Running Engine...");
        await updateUserRecommendations(userId);

        // 3. Fetch Results
        const updatedUser = await User.findOne({ userId });
        const scores = updatedUser.recommendationScores;

        console.log(`Scores Calculated: ${scores.size}`);

        // 4. Inspect Top 5
        const top5 = Array.from(scores.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        console.log("\nTop 5 Recommendations:");
        for (const [id, score] of top5) {
            const p = await Problem.findOne({ id });
            console.log(`[${score.toFixed(4)}] ${p.title} (${p.difficulty}) - Tags: ${p.tags.slice(0, 3)} - Co: ${p.companies.slice(0, 3)}`);
        }

    } catch (error) {
        console.error("Verification Failed:", error);
    } finally {
        await mongoose.disconnect();
    }
}

verify();
