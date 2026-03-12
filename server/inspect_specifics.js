import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

async function check() {
    try {
        const mongoUri = process.env.MONGO_URI;
        await mongoose.connect(mongoUri);
        const db = mongoose.connection.db;
        const collection = db.collection('display-problems');

        const p40 = await collection.findOne({ id: '40' });
        console.log('Problem 40 testCases:', JSON.stringify(p40.testCases, null, 2));

        const p398 = await collection.findOne({ id: '398' });
        console.log('Problem 398 methodName:', p398.methodName);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

check();
