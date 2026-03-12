import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

function generateValidPython(template) {
    if (!template) return "class Solution:\n    pass\n";
    // Match Python method definitions and append 'pass' to them
    // This allows the code to be syntactically valid without an external API
    let lines = template.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('def ') && lines[i].trim().endsWith(':')) {
            // Find base indentation of the def to indent the pass statement correctly
            const indent = lines[i].match(/^\s*/)[0];
            lines.splice(i + 1, 0, indent + "    pass");
            i++; // skip newly inserted line
        }
    }
    return lines.join('\n');
}

function generateValidJava(template) {
    if (!template) return "class Solution {\n}\n";
    let lines = template.split('\n');
    let openBrackets = 0;

    // Check if the template typically ends with an open bracket needing closure
    if (template.trim().endsWith('{')) {
        return template + "\n        throw new UnsupportedOperationException();\n    }\n}";
    }

    // For design problems with multiple methods ending in {
    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (trimmed.endsWith('{') && (trimmed.includes('public') || trimmed.includes('private'))) {
            const indent = lines[i].match(/^\s*/)[0];
            lines.splice(i + 1, 0, indent + "    throw new UnsupportedOperationException();\n" + indent + "}");
            i++;
        }
    }

    // Ensure properly closed
    const fullText = lines.join('\n');
    if (fullText.split('{').length > fullText.split('}').length) {
        return fullText + "\n}";
    }

    return fullText;
}

function generateValidCpp(template) {
    if (!template) return "class Solution {\n};\n";
    if (template.trim().endsWith('{')) {
        return template + "\n        throw runtime_error(\"Not implemented\");\n    }\n};";
    }
    let lines = template.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (trimmed.endsWith('{') && trimmed.includes('(')) {
            const indent = lines[i].match(/^\s*/)[0];
            lines.splice(i + 1, 0, indent + "    throw runtime_error(\"Not implemented\");\n" + indent + "}");
            i++;
        }
    }
    const fullText = lines.join('\n');
    if (fullText.split('{').length > fullText.split('}').length) {
        return fullText + "\n};";
    }
    return fullText;
}

async function fix() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const problemSchema = new mongoose.Schema({}, { collection: 'display-problems', strict: false });
        const Problem = mongoose.model('Problem', problemSchema);

        const problems = await Problem.find({});
        let count = 0;

        for (let p of problems) {
            // If optimalSolution is missing, or is an array that contains an empty `code` string
            let isMissing = false;
            if (!p.get('optimalSolution')) {
                isMissing = true;
            } else if (Array.isArray(p.get('optimalSolution'))) {
                const arr = p.get('optimalSolution');
                if (arr.some(s => !s.code || s.code.trim() === '')) {
                    isMissing = true;
                }
            } else if (typeof p.get('optimalSolution') === 'string' && p.get('optimalSolution').trim() === '') {
                isMissing = true;
            }

            if (isMissing) {
                const templates = p.get('templates') || {};
                const pyCode = generateValidPython(templates.python3 || templates.python || "");
                const javaCode = generateValidJava(templates.java || "");
                const cppCode = generateValidCpp(templates.cpp || "");

                p.set('optimalSolution', [
                    { language: 'python', code: pyCode },
                    { language: 'java', code: javaCode },
                    { language: 'cpp', code: cppCode }
                ]);

                await p.save();
                count++;
            }
        }

        console.log(`Updated ${count} problems with missing optimal solutions.`);

        // Export data
        const updatedProblems = await Problem.find({}).lean();
        fs.writeFileSync('../exports/display-problems.json', JSON.stringify(updatedProblems, null, 2), 'utf-8');
        console.log(`Updated exports/display-problems.json`);
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

fix();
