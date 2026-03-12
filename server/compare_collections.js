import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

async function compare() {
    try {
        const mongoUri = process.env.MONGO_URI;
        await mongoose.connect(mongoUri);
        const db = mongoose.connection.db;

        const p_hyphen = await db.collection('display-problems').findOne({ id: '1' });
        const p_underscore = await db.collection('display_problems').findOne({ id: '1' });

        console.log('Sample from display-problems:', JSON.stringify(p_hyphen, null, 2));
        console.log('Sample from display_problems:', JSON.stringify(p_underscore, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

compare();
