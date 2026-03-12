
import axios from 'axios';
import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:5001/api';
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error("Missing MONGO_URI in .env"); process.exit(1); }

async function verify() {
    console.log("Starting Onboarding Verification...");

    // 1. Verify Metadata Endpoint
    try {
        const metaRes = await axios.get(`${BASE_URL}/problems/metadata`);
        if (metaRes.status === 200 && Array.isArray(metaRes.data.companies) && Array.isArray(metaRes.data.tags)) {
            console.log("✅ Metadata Endpoint working.");
            console.log(`   Companies: ${metaRes.data.companies.length}, Tags: ${metaRes.data.tags.length}`);
        } else {
            console.error("❌ Metadata Endpoint failed:", metaRes.data);
        }
    } catch (err) {
        console.error("❌ Metadata Endpoint error:", err.message);
    }

    // 2. Setup Test User
    await mongoose.connect(MONGO_URI);
    const testUserId = "onboarding_test_user_" + Date.now();

    // Create dummy user logic (accessing DB directly)
    let user = new User({
        userId: testUserId,
        name: "Test User",
        username: "onboard_test",
        email: `test_${Date.now()}@example.com`,
        totalInteractions: 0,
        preferredCompanies: {},
        skillDistribution: []
    });
    await user.save();
    console.log(`Created test user: ${testUserId}`);

    // 3. Call Onboard Endpoint (Multi-select)
    const payload = {
        userId: testUserId,
        preferredCompanies: ["Google", "Microsoft", "Meta.Inc"], // Test special char replacement
        experience: "Intermediate",
        topics: ["Arrays", "Dynamic Programming"]
    };

    try {
        const res = await axios.post(`${BASE_URL}/users/onboard`, payload);
        if (res.status === 200) {
            console.log("✅ Onboard Endpoint success.");

            // 4. Verify DB State
            const updatedUser = await User.findOne({ userId: testUserId });

            // Check Preferred Companies
            const google = updatedUser.preferredCompanies.get("Google");
            const ms = updatedUser.preferredCompanies.get("Microsoft");
            const meta = updatedUser.preferredCompanies.get("Meta_Inc"); // replaced . with _

            if (google === 3 && ms === 3 && meta === 3) console.log("✅ Preferred Companies set correctly (Multi-select).");
            else console.error(`❌ Preferred Company mismatch: Google=${google}, MS=${ms}, Meta=${meta}`);

            // Check Experience
            if (updatedUser.experience === "Intermediate") console.log("✅ Experience set correctly.");
            else console.error("❌ Experience mismatch:", updatedUser.experience);

            // Check Skills
            const arraysSkill = updatedUser.skillDistribution.find(s => s.name === "Arrays");
            const dpSkill = updatedUser.skillDistribution.find(s => s.name === "Dynamic Programming");

            // Intermediate = 2 -> Score = 0.1
            if (arraysSkill && Math.abs(arraysSkill.level - 0.1) < 0.001) console.log("✅ Arrays Skill set correctly (0.1).");
            else console.error("❌ Arrays Skill mismatch:", arraysSkill);

            if (dpSkill && Math.abs(dpSkill.level - 0.1) < 0.001) console.log("✅ DP Skill set correctly (0.1).");
            else console.error("❌ DP Skill mismatch:", dpSkill);

            // 5. Verify Stats Endpoint (Infinite Loop Fix)
            const statsRes = await axios.get(`${BASE_URL}/users/${testUserId}/stats`);
            if (statsRes.status === 200) {
                const u = statsRes.data.user;
                // Check if preferredCompanies is returned as an Object (not empty)
                if (u.preferredCompanies && u.preferredCompanies.Google === 3) {
                    console.log("✅ Stats Endpoint returns preferredCompanies object correctly.");
                } else {
                    console.error("❌ Stats Endpoint missing preferredCompanies object:", u.preferredCompanies);
                }
            } else {
                console.error("❌ Stats Endpoint failed:", statsRes.status);
            }

        } else {
            console.error("❌ Onboard Endpoint returned status:", res.status);
        }
    } catch (err) {
        console.error("❌ Onboard Endpoint error:", err.response ? err.response.data : err.message);
    }

    // Cleanup
    await User.deleteOne({ userId: testUserId });
    await mongoose.disconnect();
    console.log("Verification Complete.");
}

verify();
