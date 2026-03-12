import mongoose from 'mongoose';

async function run() {
    try {
        await mongoose.connect('mongodb+srv://dhruvbhalode2022_db_user:0WjmURcyRPbELRcq@cluster0.qiusjwq.mongodb.net/capstone');
        const db = mongoose.connection.db;
        const collection = db.collection('display-problems');

        const problems = await collection.find({}, {
            projection: {
                id: 1,
                optimalSolution: 1,
                optimalTimeComplexity: 1,
                optimalSpaceComplexity: 1,
                tags: 1,
                difficulty: 1,
                description: 1
            }
        }).toArray();

        const fs = await import('fs');
        fs.writeFileSync('complexity_test_data.json', JSON.stringify(problems, null, 2));
        console.log(`Exported ${problems.length} records for verification.`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
