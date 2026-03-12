import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

async function testInteraction() {
    try {
        // 1. Signup
        console.log("Signing up...");
        const randomEmail = `test${Math.floor(Math.random() * 10000)}@example.com`;
        const signupRes = await axios.post(`${API_URL}/signup`, {
            name: 'Test User',
            email: randomEmail,
            password: 'password123'
        });
        const user = signupRes.data.user;
        console.log("Signed up as:", user.id, "Username:", user.username);

        if (!/^\d{16}$/.test(user.id)) {
            console.error("ERROR: User ID is not a 16-digit number!", user.id);
        } else {
            console.log("SUCCESS: User ID is a 16-digit number.");
        }

        // 2. Send Interaction
        console.log("Sending Interaction...");
        const interactionData = {
            userId: user.id,
            username: user.username || user.email.split('@')[0],
            problemId: 'two-sum', // Mock ID
            title: 'Two Sum',
            language: 'python',
            submissionStatus: 1,
            timeTakenSeconds: 45,
            runtimeMs: 35.5,
            memoryUsedKB: 4096
        };

        const interactionRes = await axios.post(`${API_URL}/interactions`, interactionData);
        console.log("Interaction Response:", interactionRes.status, interactionRes.data);

    } catch (error) {
        console.error("Error:", error.response ? error.response.data : error.message);
    }
}

testInteraction();
