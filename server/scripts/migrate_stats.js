import mongoose from 'mongoose';
import Interaction from '../models/Interaction.js';
import Problem from '../models/Problem.js';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error("Missing MONGO_URI in .env"); process.exit(1); }

async function migrate() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB for Migration");

        // ---------------------------------------------------------
        // Step 1: Backfill Interactions with Data from Problems
        // ---------------------------------------------------------
        console.log("Starting Interaction Backfill...");
        const validProblemIds = await Problem.find({}, { id: 1 }).lean();
        const problemMap = new Map();

        // Fetch full problem details for map
        const allProblems = await Problem.find({});
        allProblems.forEach(p => {
            problemMap.set(p.id, p);
        });

        const interactions = await Interaction.find({});
        console.log(`Found ${interactions.length} interactions to process.`);

        let interactionUpdates = 0;
        for (const interaction of interactions) {
            const problem = problemMap.get(interaction.problemId);
            if (problem) {
                let updated = false;

                // Update Companies
                if (!interaction.companies || interaction.companies.length === 0) {
                    if (problem.companies && problem.companies.length > 0) {
                        interaction.companies = problem.companies;
                        updated = true;
                    }
                }

                // Update Difficulty
                if (!interaction.difficulty) {
                    if (problem.difficulty) {
                        interaction.difficulty = problem.difficulty;
                        updated = true;
                    }
                }

                // Update Tags
                if (!interaction.tags || interaction.tags.length === 0) {
                    if (problem.tags && problem.tags.length > 0) {
                        interaction.tags = problem.tags;
                        updated = true;
                    }
                }

                if (updated) {
                    try {
                        await interaction.save();
                        interactionUpdates++;
                    } catch (saveErr) {
                        console.error(`Failed to update interaction ${interaction._id}:`, saveErr.message);
                    }
                }
            } else {
                console.warn(`Warning: Problem ${interaction.problemId} not found for interaction ${interaction._id}`);
            }
        }
        console.log(`Updated ${interactionUpdates} interactions.`);

        // ---------------------------------------------------------
        // Step 2: Update User Statistics from Interactions
        // ---------------------------------------------------------
        console.log("Starting User Statistics Update...");
        const users = await User.find({});
        console.log(`Found ${users.length} users to process.`);

        for (const user of users) {
            console.log(`Processing user: ${user.username} (${user.userId})`);

            // Fetch ALL interactions for this user (now they have backfilled data)
            const userInteractions = await Interaction.find({ userId: user.userId });

            // Reset Stats Containers
            user.preferredCompanies = new Map();
            user.topicTags = new Map();
            user.solvedCountByDifficulty = { Easy: 0, Medium: 0, Hard: 0 }; // Mongoose object

            // Re-calculate
            for (const interaction of userInteractions) {
                // 1. Preferred Companies (All Attempts)
                if (interaction.companies && interaction.companies.length > 0) {
                    interaction.companies.forEach(company => {
                        const safeKey = company.replace(/\./g, '_');
                        const current = user.preferredCompanies.get(safeKey) || 0;
                        user.preferredCompanies.set(safeKey, current + 1);
                    });
                }

                // 2. Solved Stats (Status 1)
                if (interaction.submissionStatus === 1) {
                    const difficulty = interaction.difficulty;

                    // Count by Difficulty
                    if (difficulty && ['Easy', 'Medium', 'Hard'].includes(difficulty)) {
                        user.solvedCountByDifficulty[difficulty] = (user.solvedCountByDifficulty[difficulty] || 0) + 1;
                    }

                    // Topic Tags
                    if (interaction.tags && interaction.tags.length > 0) {
                        interaction.tags.forEach(tag => {
                            const safeTag = tag.replace(/\./g, '_');
                            let topicStats = user.topicTags.get(safeTag);
                            if (!topicStats) {
                                topicStats = { Easy: 0, Medium: 0, Hard: 0 };
                            }

                            if (difficulty && ['Easy', 'Medium', 'Hard'].includes(difficulty)) {
                                topicStats[difficulty] = (topicStats[difficulty] || 0) + 1;
                            }
                            user.topicTags.set(safeTag, topicStats);
                        });
                    }
                }
            }

            // Save User
            try {
                await user.save();
                console.log(`Saved stats for user ${user.username}.`);
            } catch (userSaveErr) {
                console.error(`Failed to update user ${user.username}:`, userSaveErr.message);
            }
        }

        console.log("Migration Complete.");

    } catch (error) {
        console.error("Migration Failed:", error);
    } finally {
        await mongoose.disconnect();
    }
}

migrate();
