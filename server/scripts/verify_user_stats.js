import mongoose from 'mongoose';
import Interaction from '../models/Interaction.js';
import Problem from '../models/Problem.js';
import User from '../models/User.js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error("Missing MONGO_URI in .env"); process.exit(1); }

async function verify() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        const timestamp = Date.now();
        const dummyProblemId = "test-prob-stats-" + timestamp;
        const dummyUserId = "1234567890123456"; // Use exiting mock ID or new one? using mock
        // Need to ensure user exists for updates to happen

        // 1. Create/Reset Dummy User
        await User.deleteOne({ userId: dummyUserId });
        const dummyUser = new User({
            name: "Stats Tester",
            email: `stats${timestamp}@test.com`,
            username: "statstester",
            userId: dummyUserId,
            password: "hashedpassword"
        });
        await dummyUser.save();
        console.log("Dummy user created");

        // 2. Create Dummy Problem
        const dummyProblem = new Problem({
            id: dummyProblemId,
            title: "Test Problem Stats",
            difficulty: "Medium",
            description: "Desc",
            companies: ["Google", "Amazon"],
            tags: ["DP", "Arrays"]
        });
        await dummyProblem.save();
        console.log("Dummy problem created");

        // 3. Send Interaction 1 (Solved)
        const payload1 = {
            userId: dummyUserId,
            username: "statstester",
            problemId: dummyProblemId,
            title: "Test Problem Stats",
            language: "python",
            submissionStatus: 1, // Solved
            timeTakenSeconds: 10,
            runtimeMs: 50,
            memoryUsedKB: 1024
        };

        try {
            await axios.post('http://localhost:5001/api/interactions', payload1);
            console.log("Interaction 1 (Solved) posted");
        } catch (err) {
            console.error("Interaction 1 failed:", err.message);
            throw err;
        }

        // 4. Verify Stats after Solve
        let user = await User.findOne({ userId: dummyUserId });

        // Check preferredCompanies
        // Map in Mongoose is object in JSON or Map? accessor depends.
        // user.preferredCompanies should be a Map.
        const googleCount = user.preferredCompanies.get("Google");
        const amazonCount = user.preferredCompanies.get("Amazon");

        if (googleCount !== 1 || amazonCount !== 1) {
            throw new Error(`Failed: Expected Google=1, Amazon=1. Got Google=${googleCount}, Amazon=${amazonCount}`);
        }

        // Check solvedCountByDifficulty
        if (user.solvedCountByDifficulty.Medium !== 1) {
            throw new Error(`Failed: Expected Medium Solved=1. Got ${user.solvedCountByDifficulty.Medium}`);
        }

        // Check topicTags
        const dpStats = user.topicTags.get("DP");
        if (!dpStats || dpStats.Medium !== 1) {
            throw new Error(`Failed: Expected DP.Medium=1. Got ${JSON.stringify(dpStats)}`);
        }

        console.log("Verification Step 1 Passed: Stats updated for Solved problem");

        // 5. Send Interaction 2 (Failed)
        const payload2 = { ...payload1, submissionStatus: 0 };
        try {
            await axios.post('http://localhost:5001/api/interactions', payload2);
            console.log("Interaction 2 (Failed) posted");
        } catch (err) {
            console.error("Interaction 2 failed:", err.message);
            throw err;
        }

        // 6. Verify Stats after Fail
        user = await User.findOne({ userId: dummyUserId });

        // Preferred Companies should increment (Attempted)
        const googleCount2 = user.preferredCompanies.get("Google");
        if (googleCount2 !== 2) {
            throw new Error(`Failed: Expected Google=2 (after fail). Got ${googleCount2}`);
        }

        // Solved Count should NOT increment
        if (user.solvedCountByDifficulty.Medium !== 1) {
            throw new Error(`Failed: Expected Medium Solved=1 (unchanged). Got ${user.solvedCountByDifficulty.Medium}`);
        }

        // Topic Tags should NOT increment
        const dpStats2 = user.topicTags.get("DP");
        if (dpStats2.Medium !== 1) {
            throw new Error(`Failed: Expected DP.Medium=1 (unchanged). Got ${dpStats2.Medium}`);
        }

        console.log("Verification Step 2 Passed: Stats correctly handled failure");

        // Cleanup
        await User.deleteOne({ userId: dummyUserId });
        await Problem.deleteOne({ id: dummyProblemId });
        // interactions cleanup left for now or do it:
        await Interaction.deleteMany({ userId: dummyUserId });
        console.log("Cleanup complete");
        console.log("ALL TESTS PASSED");

    } catch (error) {
        console.error("Verification Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

verify();
