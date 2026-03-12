import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function exportCollections() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const collectionsToExport = [
            { name: 'display-problems', file: '../exports/display-problems.json' },
            { name: 'users', file: '../exports/users.json' },
            { name: 'interactions', file: '../exports/interactions.json' }
        ];

        for (const col of collectionsToExport) {
            const Model = mongoose.models[col.name] || mongoose.model(col.name, new mongoose.Schema({}, { collection: col.name, strict: false }));
            const data = await Model.find({}).lean();
            fs.writeFileSync(path.join(__dirname, col.file), JSON.stringify(data, null, 2), 'utf-8');
            console.log(`Exported ${data.length} records to ${col.file}`);
        }

    } catch (e) {
        console.error("Error during export:", e);
    } finally {
        await mongoose.disconnect();
    }
}

exportCollections();
