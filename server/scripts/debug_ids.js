
import mongoose from 'mongoose';
import User from '../models/User.js';
import Problem from '../models/Problem.js';
import Interaction from '../models/Interaction.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) { console.error("Missing MONGO_URI"); process.exit(1); }

async function debug() {
    try {
        await mongoose.connect(MONGO_URI);

        // 1. Check Two Sum
        console.log("--- Problem: Two Sum ---");
        const twoSum = await Problem.findOne({ title: "Two Sum" });
        if (twoSum) {
            console.log(`Title: ${twoSum.title}`);
            console.log(`ID: ${twoSum.id} (Type: ${typeof twoSum.id})`);
        } else {
            console.log("Two Sum NOT FOUND");
        }

        // 2. Check Recent Interaction
        console.log("\n--- Last Interaction ---");
        const lastInteraction = await Interaction.findOne().sort({ createdAt: -1 });
        if (lastInteraction) {
            console.log(`User: ${lastInteraction.username}`);
            console.log(`Problem: ${lastInteraction.title}`);
            console.log(`ProblemID: ${lastInteraction.problemId} (Type: ${typeof lastInteraction.problemId})`);
            console.log(`Status: ${lastInteraction.submissionStatus}`);
        } else {
            console.log("No interactions found.");
        }

        // 3. User Solved IDs
        if (lastInteraction) {
            const user = await User.findOne({ userId: lastInteraction.userId });
            console.log(`\n--- User: ${user.username} ---`);
            console.log(`uniqueSolvedIds:`, user.uniqueSolvedIds);

            if (twoSum) {
                const match = user.uniqueSolvedIds.includes(twoSum.id);
                console.log(`Contains Two Sum ID (${twoSum.id})? ${match}`);
            }
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

debug();
