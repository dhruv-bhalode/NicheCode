import axios from 'axios';
import User from '../models/User.js';

/**
 * Updates the successScores map for a user by calling the Python ML backend.
 * @param {string} userId - The 16-digit userId.
 */
export const updateSuccessScores = async (userId) => {
    try {
        console.log(`[SuccessPredictor] Updating scores for user ${userId}...`);

        // Call Python Backend for all 2811 predictions
        const response = await axios.post('http://127.0.0.1:5002/api/predict-all-success', {
            userId: userId
        });

        if (response.data && response.data.success) {
            const { scores } = response.data;

            // Update User document in MongoDB
            // Using $set with successScores to overwrite the map
            await User.findOneAndUpdate(
                { userId: userId },
                { $set: { successScores: scores } },
                { new: true }
            );

            console.log(`[SuccessPredictor] Successfully updated ${Object.keys(scores).length} scores for user ${userId}`);
        } else {
            console.error(`[SuccessPredictor] Python backend returned error:`, response.data.error);
        }
    } catch (error) {
        console.error(`[SuccessPredictor] Failed to update success scores:`, error.message);
    }
};
