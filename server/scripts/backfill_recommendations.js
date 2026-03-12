
import mongoose from 'mongoose';
import User from '../models/User.js';
import Problem from '../models/Problem.js'; // Ensure Problem is registered
import { updateUserRecommendations } from '../utils/recommendationEngine.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) { console.error("Missing MONGO_URI in .env"); process.exit(1); }

async function backfill() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB for Backfill.");

        const users = await User.find({});
        console.log(`Found ${users.length} users.`);

        for (const user of users) {
            console.log(`Processing user: ${user.username} (${user.userId})...`);
            await updateUserRecommendations(user.userId);
        }

        console.log("Backfill Complete.");

    } catch (error) {
        console.error("Backfill Failed:", error);
    } finally {
        await mongoose.disconnect();
    }
}

backfill();
