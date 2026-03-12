import mongoose from 'mongoose';

const interactionSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // 16-digit numeric string
    username: { type: String, required: true },
    problemId: { type: String, required: true }, // Problem ID is a string (slug/id) in display-problems
    title: { type: String, required: true }, // Problem Title
    language: { type: String, required: true },
    submissionStatus: { type: Number, required: true, enum: [0, 1] }, // 1 for success, 0 for failure
    timeTakenSeconds: { type: Number, required: true },
    runtimeMs: { type: Number, required: true },
    memoryUsedKB: { type: Number, required: true },
    companies: [String], // Fetched from display-problems
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] }, // Fetched from display-problems
    tags: [String], // Fetched from display-problems
    createdAt: { type: Date, default: Date.now }
}, { collection: 'interactions' });

const Interaction = mongoose.model('Interaction', interactionSchema);

export default Interaction;
