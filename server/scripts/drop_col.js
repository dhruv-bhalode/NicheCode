import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') }); // Note the path change if it's in server/scripts

async function drop() {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) throw new Error('MONGO_URI not found');

        await mongoose.connect(mongoUri);
        const db = mongoose.connection.db;

        console.log('Collections:', (await db.listCollections().toArray()).map(c => c.name));

        try {
            await db.collection('display_problems').drop();
            console.log('Dropped display_problems');
        } catch (e) {
            console.log('Drop failed (maybe already gone?):', e.message);
        }

    } catch (err) {
        console.error('CRITICAL ERROR:', err);
    } finally {
        await mongoose.disconnect();
    }
}

drop();
