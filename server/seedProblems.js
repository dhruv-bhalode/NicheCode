import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Problem from './models/Problem.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected for seeding');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

const seedProblems = async () => {
    await connectDB();

    try {
        const jsonPath = path.join(__dirname, '..', 'public', 'problems.json');
        console.log(`Reading problems from ${jsonPath}...`);

        if (!fs.existsSync(jsonPath)) {
            console.error("Error: problems.json not found in public folder. Please run the import script first.");
            process.exit(1);
        }

        const data = fs.readFileSync(jsonPath, 'utf-8');
        const problems = JSON.parse(data);

        console.log(`Found ${problems.length} problems to seed.`);

        // Batch process to avoid memory issues if array is huge
        const batchSize = 100;
        for (let i = 0; i < problems.length; i += batchSize) {
            const batch = problems.slice(i, i + batchSize);
            const operations = batch.map(problem => ({
                updateOne: {
                    filter: { id: problem.id },
                    update: { $set: problem },
                    upsert: true
                }
            }));

            await Problem.bulkWrite(operations);
            console.log(`Processed batch ${i + 1} to ${Math.min(i + batchSize, problems.length)}`);
        }

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
};

seedProblems();
