import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const userSchema = new mongoose.Schema({
    userId: String,
    email: String,
    successScores: { type: Map, of: Number }
});

const User = mongoose.model('User', userSchema);

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({ successScores: { $exists: true, $ne: {} } }).sort({ _id: -1 }).limit(5);
    console.log('--- Users with successScores ---');
    users.forEach(u => {
        console.log(`User: ${u.email} (${u.userId})`);
        console.log(`Score count: ${u.successScores ? u.successScores.size : 0}`);
        if (u.successScores && u.successScores.size > 0) {
            // Log first 2 keys
            const keys = Array.from(u.successScores.keys()).slice(0, 2);
            keys.forEach(k => console.log(`  ${k}: ${u.successScores.get(k)}`));
        }
    });

    const allUsers = await User.find().sort({ _id: -1 }).limit(5);
    console.log('\n--- Most recent users ---');
    allUsers.forEach(u => {
        console.log(`User: ${u.email} (${u.userId}) - Scores present: ${!!u.successScores && u.successScores.size > 0}`);
    });

    await mongoose.disconnect();
}

check();
