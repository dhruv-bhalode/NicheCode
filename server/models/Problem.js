import mongoose from 'mongoose';

const problemSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    description: { type: String, required: true },
    inputFormat: String,
    outputFormat: String,
    constraints: [String],
    testCases: [{
        input: String,
        output: String,
        explanation: String
    }],
    tags: [String],
    hints: [String],
    optimalSolution: [{
        language: { type: String, enum: ['python', 'cpp', 'java', 'javascript'] },
        code: String
    }],
    timeComplexity: String,
    spaceComplexity: String,
    bruteForceTimeComplexity: String,
    bruteForceSpaceComplexity: String,
    optimalTimeComplexity: String,
    optimalSpaceComplexity: String,
    template: String,
    templates: {
        cpp: String,
        java: String,
        python: String,
        javascript: String
    },
    methodName: String,
    mcqs: [{
        id: String,
        question: String,
        options: [String],
        correctAnswer: Number,
        explanation: String,
        category: { type: String, enum: ['data-structure', 'algorithm', 'approach'] }
    }],
    acceptanceRate: Number,
    frequency: Number,
    companies: [String]
}, { collection: 'display-problems' }); // Explicit collection name

const Problem = mongoose.model('Problem', problemSchema);

export default Problem;
