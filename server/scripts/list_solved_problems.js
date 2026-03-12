import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('c:/VSCODE_CAPSTONE/Capstone_Phase2/server/.env') });

const UserSchema = new mongoose.Schema({ userId: String, uniqueSolvedIds: [String] });
const ProblemSchema = new mongoose.Schema({ id: String, title: String });

const User = mongoose.model('User', UserSchema);
const Problem = mongoose.model('Problem', ProblemSchema);

async function listSolved() {
    await mongoose.connect(process.env.MONGO_URI);
    const userId = "8907443241427236";
    const user = await User.findOne({ userId });

    if (!user) {
        console.log("User not found");
        return;
    }

    console.log(`User ${userId} has solved ${user.uniqueSolvedIds.length} problems:\n`);
    console.log(`Raw IDs: ${user.uniqueSolvedIds.join(', ')}`);

    // The collection name is 'display-problems' based on previous context
    const problems = await mongoose.connection.db.collection('display-problems').find({ id: { $in: user.uniqueSolvedIds } }).toArray();

    if (problems.length === 0) {
        console.log("No matching problems found in 'display-problems' collection using 'id' field!");
        // Try searching by _id just in case
        const problemsById = await mongoose.connection.db.collection('display-problems').find({ _id: { $in: user.uniqueSolvedIds } }).toArray();
        if (problemsById.length > 0) {
            console.log("Found matches using '_id' field instead:");
            problemsById.forEach(p => console.log(`- [_id:${p._id}] ${p.title}`));
        }
    } else {
        problems.forEach(p => console.log(`- [id:${p.id}] ${p.title}`));
    }

    await mongoose.disconnect();
}

listSolved();
