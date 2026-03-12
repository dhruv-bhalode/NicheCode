import User from '../models/User.js';
import Problem from '../models/Problem.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import Interaction from '../models/Interaction.js';
import { calculateUserRetentionScores } from './skillDecay.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants for Scoring
const WEIGHTS = {
    RATING: 0.25,
    STRONGEST: 0.15,
    WEAKEST: 0.15,
    COMPANY: 0.20,
    MISSING: 0.15,
    RECENT: 0.10
};

const DIFFICULTY_MAP = {
    'Easy': 1000,
    'Medium': 1500,
    'Hard': 2000
};

let cachedProblems = null;
let lastCacheTime = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

async function getProblems() {
    const now = Date.now();
    if (!cachedProblems || (now - lastCacheTime > CACHE_TTL)) {
        console.log("Fetching problems for recommendation engine...");
        // Fetch only needed fields to save memory
        cachedProblems = await Problem.find({}, {
            id: 1,
            difficulty: 1,
            tags: 1,
            companies: 1
        }).lean();
        lastCacheTime = now;
        console.log(`Cached ${cachedProblems.length} problems.`);
    }
    return cachedProblems;
}

// (Removed Python calculateRetention - now using Node-native skillDecay.js)

// Function to call NCF Recommendation Script
const getNCFRecommendations = async (userId) => {
    return new Promise((resolve, reject) => {
        try {
            const recommendationEngineDir = path.join(__dirname, '..', '..', 'recommendation_engine');
            const scriptPath = path.join(recommendationEngineDir, 'recommend.py');
            const pythonProcess = spawn('python', [scriptPath, userId], {
                cwd: recommendationEngineDir
            });

            let dataString = '';
            let errorString = '';

            pythonProcess.stdout.on('data', (data) => {
                dataString += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                errorString += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error(`NCF script exited with code ${code}: ${errorString}`);
                    resolve({});
                } else {
                    try {
                        const results = JSON.parse(dataString);
                        resolve(results);
                    } catch (e) {
                        console.error("Failed to parse NCF output:", e);
                        resolve({});
                    }
                }
            });
        } catch (error) {
            console.error("Error executing NCF script:", error);
            resolve({});
        }
    });
};

export const updateUserRecommendations = async (userId) => {
    try {
        console.log(`[RecEngine] Starting intelligent NCF update for ${userId}`);
        const user = await User.findOne({ userId });
        if (!user) {
            console.error(`User ${userId} not found for recommendation update.`);
            return;
        }

        // 0. Calculate Retention for Solved Problems (Spaced Repetition)
        const retentionMap = await calculateUserRetentionScores(userId);

        // 1. Get Neural Collaborative Filtering (NCF) Scores
        const ncfScores = await getNCFRecommendations(userId);

        // 2. Prepare User Profile for Heuristic Scoring (Rules)
        const sortedSkills = [...(user.skillDistribution || [])].sort((a, b) => b.level - a.level);
        const strongestTags = new Set(sortedSkills.slice(0, 3).map(s => s.name));
        const weakestTags = new Set(sortedSkills.filter(s => s.level > 0).slice(-3).map(s => s.name));
        const knownTags = new Set(sortedSkills.map(s => s.name));
        const userRating = user.userRating || 1200;

        const companyEntries = user.preferredCompanies ? Array.from(user.preferredCompanies.entries()) : [];
        const topCompanies = new Set(
            companyEntries.sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0].replace(/_/g, '.'))
        );

        // 3. Map and Combine Scores (Hybrid)
        const finalScores = new Map();
        const problems = await getProblems();

        for (const problem of problems) {
            const isSolved = user.uniqueSolvedIds && user.uniqueSolvedIds.includes(problem.id);

            if (isSolved) {
                // Determine retention for solved problems (Already negative from skillDecay.js)
                const retention = retentionMap[problem.id] !== undefined ? retentionMap[problem.id] : -1.0;
                finalScores.set(problem.id, parseFloat(retention.toFixed(4)));
            } else {
                // --- A. Discovery Score (NCF Neural Prob) ---
                const ncfProb = ncfScores[problem.id] !== undefined ? ncfScores[problem.id] : 0.1;

                // --- B. Preference Score (Rule-Based Heuristic) ---
                let ruleScore = 0;

                // User Rating Match (0.25)
                const probDiffVal = DIFFICULTY_MAP[problem.difficulty] || 1500;
                const diff = Math.abs(userRating - probDiffVal);
                ruleScore += WEIGHTS.RATING * Math.max(0, 1 - (diff / 1000));

                // Strongest Skills (0.15)
                if (problem.tags && problem.tags.some(t => strongestTags.has(t))) ruleScore += WEIGHTS.STRONGEST;

                // Weakest Skills (0.15)
                if (problem.tags && problem.tags.some(t => weakestTags.has(t))) ruleScore += WEIGHTS.WEAKEST;

                // Preferred Companies (0.20)
                if (problem.companies && problem.companies.some(c => topCompanies.has(c))) ruleScore += WEIGHTS.COMPANY;

                // Missing Skills (0.15)
                if (problem.tags && problem.tags.some(t => !knownTags.has(t))) ruleScore += WEIGHTS.MISSING;

                // --- C. Blend (50/50) ---
                // We normalize ncfProb (0-1) and ruleScore (scaled by WEIGHTS total ~1.0)
                const hybridScore = (ncfProb * 0.5) + (ruleScore * 0.5);

                finalScores.set(problem.id, parseFloat(hybridScore.toFixed(4)));
            }
        }

        // 3. Save to User
        user.recommendationScores = finalScores;
        user.markModified('recommendationScores');
        await user.save();

        console.log(`[RecEngine] Successfully updated NCF recommendations for ${user.username}`);

    } catch (error) {
        console.error("[RecEngine] Error updating recommendations:", error);
    }
};
