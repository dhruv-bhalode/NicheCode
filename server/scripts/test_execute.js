
import axios from 'axios';

async function testExecute() {
    try {
        const payload = {
            language: 'python',
            code: 'class Solution:\\n    def solution(self, a, b): return a + b',
            test_cases: [
                { input: '1, 2', expected_output: '3' },
                { input: '5, 5', expected_output: '10' }
            ],
            method_name: 'solution'
        };

        console.log("Sending payload:", payload);

        const response = await axios.post('http://localhost:8000/execute', payload);
        console.log("Response:", response.data);

    } catch (error) {
        console.error("Error:", error.message);
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        }
    }
}

testExecute();
