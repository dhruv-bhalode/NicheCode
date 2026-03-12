import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

async function deleteExtraCollection() {
    try {
        const mongoUri = process.env.MONGO_URI;
        await mongoose.connect(mongoUri);
        const db = mongoose.connection.db;

        console.log('--- Database Collections Before Delete ---');
        const collections = await db.listCollections().toArray();
        collections.forEach(c => console.log(`- ${c.name}`));

        if (collections.some(c => c.name === 'display_problems')) {
            console.log('\nDeleting "display_problems" collection...');
            await db.collection('display_problems').drop();
            console.log('Successfully deleted "display_problems".');
        } else {
            console.log('\nCollection "display_problems" not found.');
        }

        console.log('\n--- Database Collections After Delete ---');
        const collectionsAfter = await db.listCollections().toArray();
        collectionsAfter.forEach(c => console.log(`- ${c.name}`));

    } catch (err) {
        console.error('Error during deletion:', err);
    } finally {
        await mongoose.disconnect();
    }
}

deleteExtraCollection();
