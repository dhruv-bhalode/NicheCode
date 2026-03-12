import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

async function inspect() {
    try {
        const mongoUri = process.env.MONGO_URI;
        await mongoose.connect(mongoUri);
        const db = mongoose.connection.db;

        const h_cols = await db.collection('display-problems').find().limit(1).toArray();
        const u_cols = await db.collection('display_problems').find().limit(1).toArray();

        console.log('--- display-problems (hyphen) ---');
        console.log(JSON.stringify(h_cols[0], null, 2));

        console.log('\n--- display_problems (underscore) ---');
        console.log(JSON.stringify(u_cols[0], null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

inspect();
