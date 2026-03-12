// Test script for /api/users/:userId/stats endpoint
const testUserId = '6883662374019648'; // Delaine Kendall's userId

async function testStatsEndpoint() {
    try {
        const response = await fetch(`http://localhost:5001/api/users/${testUserId}/stats`);

        if (!response.ok) {
            console.error('Error:', response.status, response.statusText);
            const error = await response.json();
            console.error('Error details:', error);
            return;
        }

        const data = await response.json();

        console.log('\n=== USER STATS TEST ===\n');
        console.log('User Info:');
        console.log('  Name:', data.user.name);
        console.log('  Email:', data.user.email);
        console.log('  Experience:', data.user.experience);
        console.log('  Solved Problems:', data.user.solvedProblems);
        console.log('  Correct Problems:', data.user.correctProblems);
        console.log('  Accuracy:', data.user.accuracy + '%');
        console.log('  User Rating:', data.user.userRating);
        console.log('  Total Interactions:', data.user.totalInteractions);

        console.log('\nCalculated Stats:');
        console.log('  Avg Time:', data.stats.avgTime);
        console.log('  Streak:', data.stats.streak, 'days');

        console.log('\nTop 10 Skills:');
        data.stats.top10Skills.forEach((skill, i) => {
            console.log(`  ${i + 1}. ${skill.name}: ${skill.level}%`);
        });

        console.log('\nLast 5 Activities:');
        data.stats.last5Activities.forEach((activity, i) => {
            console.log(`  ${i + 1}. ${activity.status} "${activity.title}" (${activity.timeAgo})`);
        });

        console.log('\n=== TEST PASSED ===\n');
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testStatsEndpoint();
