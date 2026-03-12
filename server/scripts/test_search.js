// Test script for search by problem number
const axios = require('axios');

async function testSearch() {
    console.log('\n=== TESTING SEARCH BY PROBLEM NUMBER ===\n');

    // Test 1: Search by exact number
    console.log('Test 1: Searching for problem "1"...');
    try {
        const response1 = await axios.get('http://localhost:5001/api/problems', {
            params: { search: '1', limit: 5 }
        });
        console.log(`Found ${response1.data.problems.length} problems:`);
        response1.data.problems.forEach(p => console.log(`  - ID: ${p.id}, Title: ${p.title}`));
    } catch (error) {
        console.error('Error:', error.message);
    }

    // Test 2: Search by partial number
    console.log('\nTest 2: Searching for problem "42"...');
    try {
        const response2 = await axios.get('http://localhost:5001/api/problems', {
            params: { search: '42', limit: 5 }
        });
        console.log(`Found ${response2.data.problems.length} problems:`);
        response2.data.problems.forEach(p => console.log(`  - ID: ${p.id}, Title: ${p.title}`));
    } catch (error) {
        console.error('Error:', error.message);
    }

    // Test 3: Search by title (should still work)
    console.log('\nTest 3: Searching for "Two Sum"...');
    try {
        const response3 = await axios.get('http://localhost:5001/api/problems', {
            params: { search: 'Two Sum', limit: 5 }
        });
        console.log(`Found ${response3.data.problems.length} problems:`);
        response3.data.problems.forEach(p => console.log(`  - ID: ${p.id}, Title: ${p.title}`));
    } catch (error) {
        console.error('Error:', error.message);
    }

    console.log('\n=== TESTS COMPLETE ===\n');
}

testSearch();
