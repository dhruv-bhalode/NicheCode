import Interaction from '../models/Interaction.js';
import Problem from '../models/Problem.js';

// Constants for Rule-Based Ebbinghaus Decay
const DEFAULT_STABILITY = 1.0;
const FAILURE_MULTIPLIER = 0.5;
const DIFFICULTY_MULTIPLIER = { "Easy": 1.5, "Medium": 2.0, "Hard": 2.5 };
const BENCHMARKS = { "Easy": 300, "Medium": 600, "Hard": 1200 };

/**
 * Calculates stability boost based on difficulty and time taken.
 */
function calculateStabilityBoost(difficulty, timeTakenSeconds) {
    const base = DIFFICULTY_MULTIPLIER[difficulty] || 1.5;
    const benchmark = BENCHMARKS[difficulty] || 600;

    let performanceBoost = 1.0;
    if (timeTakenSeconds > 0) {
        const ratio = timeTakenSeconds / benchmark;
        if (ratio < 0.5) performanceBoost = 1.2; // Fast: +20%
        else if (ratio < 1.0) performanceBoost = 1.1; // Good: +10%
        else if (ratio > 2.0) performanceBoost = 0.8; // Slow: -20%
    }

    return base * performanceBoost;
}

/**
 * Calculates retention based on Ebbinghaus Forgetting Curve: R = e^(-t/S)
 */
function calculateRetention(lastReviewTime, stability, lastOutcome) {
    if (!lastReviewTime) return 1.0;

    const now = new Date();
    const elapsedDays = (now.getTime() - new Date(lastReviewTime).getTime()) / (1000 * 60 * 60 * 24);

    let effectiveElapsed = Math.max(0, elapsedDays);

    // Penalty for failure: Act as if one stability period has passed
    if (lastOutcome === 0) {
        effectiveElapsed += stability;
    }

    // Force 1.0 retention for very fresh successful solves (within 1 hour)
    if (lastOutcome === 1 && elapsedDays < 0.0417) {
        return 1.0;
    }

    const finalStability = stability <= 0 ? 0.5 : stability;
    let retention = Math.exp(-effectiveElapsed / finalStability);

    // Clamp retention between 0.0001 and 1.0
    return Math.min(1.0, Math.max(0.0001, retention));
}

/**
 * Re-processes all interactions to calculate current retention scores for each problem.
 */
export async function calculateUserRetentionScores(userId) {
    try {
        const interactions = await Interaction.find({ userId }).sort({ createdAt: 1 }).lean();
        if (!interactions || interactions.length === 0) return {};

        // Fetch problems to get difficulty context
        const problems = await Problem.find({}, { id: 1, difficulty: 1 }).lean();
        const problemMap = new Map(problems.map(p => [p.id, p]));

        const userState = {};

        for (const interaction of interactions) {
            const problemId = interaction.problemId;
            const problem = problemMap.get(problemId);
            const difficulty = problem ? problem.difficulty : "Medium";

            const isCorrect = interaction.submissionStatus === 1;
            const timeTaken = interaction.timeTakenSeconds || 0;
            const timestamp = interaction.createdAt;

            if (!userState[problemId]) {
                if (isCorrect) {
                    userState[problemId] = {
                        stability: DEFAULT_STABILITY * calculateStabilityBoost(difficulty, timeTaken),
                        lastReview: timestamp,
                        lastOutcome: 1
                    };
                } else {
                    userState[problemId] = {
                        stability: 0.5,
                        lastReview: timestamp,
                        lastOutcome: 0
                    };
                }
            } else {
                const currentStability = userState[problemId].stability;
                if (isCorrect) {
                    userState[problemId].stability = currentStability * calculateStabilityBoost(difficulty, timeTaken);
                    userState[problemId].lastOutcome = 1;
                } else {
                    userState[problemId].stability = currentStability * FAILURE_MULTIPLIER;
                    userState[problemId].lastOutcome = 0;
                }
                userState[problemId].lastReview = timestamp;
            }
        }

        const results = {};
        for (const problemId in userState) {
            const state = userState[problemId];
            const retention = calculateRetention(state.lastReview, state.stability, state.lastOutcome);

            // Score requirement: >= -1 and < 0
            results[problemId] = Number((-1 * retention).toFixed(4));
        }

        return results;
    } catch (error) {
        console.error("[SkillDecay] Error:", error);
        return {};
    }
}
