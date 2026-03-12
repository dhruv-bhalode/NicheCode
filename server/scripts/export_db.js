
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const exportData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');

        const exportDir = path.join(__dirname, '..', 'exports');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir);
        }

        const collectionsToExport = [
            { name: 'users', filename: 'users.json' },
            { name: 'interactions', filename: 'interactions.json' },
        ];

        // Check for 'display-problems' or 'problems'
        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        if (collectionNames.includes('display-problems')) {
            collectionsToExport.push({ name: 'display-problems', filename: 'display-problems.json' });
        } else if (collectionNames.includes('problems')) {
            console.log("Collection 'display-problems' not found, exporting 'problems' as 'display-problems.json'");
            collectionsToExport.push({ name: 'problems', filename: 'display-problems.json' });
        } else {
            console.log("Warning: Neither 'display-problems' nor 'problems' collection found.");
        }

        for (const { name, filename } of collectionsToExport) {
            console.log(`Exporting ${name}...`);
            const data = await mongoose.connection.db.collection(name).find({}).toArray();
            const filePath = path.join(exportDir, filename);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`Saved ${data.length} records to ${filePath}`);
        }

        console.log('Export complete.');
        process.exit();
    } catch (error) {
        console.error('Export failed:', error);
        process.exit(1);
    }
};

exportData();
