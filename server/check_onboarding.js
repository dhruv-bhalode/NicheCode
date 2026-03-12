import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './models/User.js';

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const latestUser = await User.findOne().sort({ _id: -1 });
        if (latestUser) {
            console.log("--- DOCUMENT ---");
            console.log("Latest User Email:", latestUser.email);
            console.log("isOnboarded field:", latestUser.isOnboarded);

            console.log("--- toJSON ---");
            const json = latestUser.toJSON();
            console.log("Keys:", Object.keys(json));
            console.log("isOnboarded:", json.isOnboarded);
            console.log("id:", json.id);

            console.log("--- toObject ---");
            const obj = latestUser.toObject();
            console.log("Keys:", Object.keys(obj));
            console.log("isOnboarded:", obj.isOnboarded);
            console.log("id:", obj.id);
        } else {
            console.log("No users found.");
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkUser();
