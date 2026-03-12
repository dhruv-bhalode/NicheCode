import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './models/User.js';

async function migrateUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for migration...");

        // Mark all existing users as onboarded if the field is missing or currently false
        // (Assuming existing users should be considered already onboarded)
        const result = await User.updateMany(
            { $or: [{ isOnboarded: { $exists: false } }, { isOnboarded: false }] },
            { $set: { isOnboarded: true } }
        );

        console.log(`Migration Complete. Updated ${result.modifiedCount} users.`);

        await mongoose.disconnect();
    } catch (err) {
        console.error("Migration failed:", err);
    }
}

migrateUsers();
