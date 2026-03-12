import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

async function list() {
    try {
        const mongoUri = process.env.MONGO_URI;
        await mongoose.connect(mongoUri);
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();

        console.log('COLLECTION_LIST_START');
        for (const col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(`COL: ${col.name} | COUNT: ${count}`);
        }
        console.log('COLLECTION_LIST_END');

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

list();
