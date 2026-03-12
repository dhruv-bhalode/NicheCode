const axios = require('axios');

async function checkApi() {
    try {
        const response = await axios.get('http://localhost:5001/api/problems/1');
        const problem = response.data;
        console.log('Problem Title:', problem.title);
        console.log('Optimal Solution Type:', typeof problem.optimalSolution);
        console.log('Is Array?', Array.isArray(problem.optimalSolution));
        if (Array.isArray(problem.optimalSolution)) {
            console.log('Languages available:', problem.optimalSolution.map(s => s.language));
            problem.optimalSolution.forEach(s => {
                console.log(`- ${s.language}: code length ${s.code ? s.code.length : 'N/A'}`);
            });
        } else {
            console.log('Optimal Solution Content:', problem.optimalSolution);
        }
    } catch (err) {
        console.error('API Error:', err.message);
        if (err.response) {
            console.error('Response status:', err.response.status);
            console.error('Response data:', err.response.data);
        }
    }
}

checkApi();
