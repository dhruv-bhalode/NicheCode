import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

async function generate() {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) throw new Error('MONGO_URI not found in .env');

        console.log('Connecting to database...');
        await mongoose.connect(mongoUri);

        const db = mongoose.connection.db;
        const problems = await db.collection('display-problems').find({}).sort({ id: 1 }).toArray();
        console.log(`Fetched ${problems.length} problems.`);

        const output_path = path.join(__dirname, '../src/data/problems.ts');

        // Helper to format string literals for TS
        function cleanStr(s) {
            if (!s) return "";
            return s.toString()
                .replace(/\\/g, "\\\\") // Escape backslashes first
                .replace(/`/g, "\\`")   // Escape backticks
                .replace(/\$\{/g, "\\${"); // Escape ${}
        }

        let tsContent = `
export interface TestCase {
    input: string;
    output: string;
    explanation?: string;
}

export interface MCQQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    category: 'data-structure' | 'algorithm' | 'approach';
}

export interface Problem {
    id: string;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    description: string;
    inputFormat: string;
    outputFormat: string;
    constraints: string[];
    testCases: TestCase[];
    tags: string[];
    hints: string[];
    optimalSolution: string | Array<{
        language: 'python' | 'cpp' | 'java' | 'javascript';
        code: string;
    }>;
    template: string;
    templates?: { [key: string]: string };
    methodName: string;
    mcqs: MCQQuestion[];
    acceptanceRate?: number;
    frequency?: number;
    companies?: string[];
    timeComplexity?: string;
    spaceComplexity?: string;
}

export const problems: Problem[] = [
`;

        for (const p of problems) {
            const testCasesStr = "[\n" + (p.testCases || []).map(tc =>
                `            { input: \`${cleanStr(tc.input)}\`, output: \`${cleanStr(tc.output)}\`, explanation: \`${cleanStr(tc.explanation)}\` }`
            ).join(",\n") + "\n        ]";

            let optimalSolutionStr;
            if (Array.isArray(p.optimalSolution)) {
                optimalSolutionStr = "[\n" + p.optimalSolution.map(sol =>
                    `            { language: '${sol.language}', code: \`${cleanStr(sol.code)}\` }`
                ).join(",\n") + "\n        ]";
            } else {
                optimalSolutionStr = `\`${cleanStr(p.optimalSolution || "AI will generate this...")}\``;
            }

            const constraintsStr = "[" + (p.constraints || []).map(c => `\`${cleanStr(c)}\``).join(", ") + "]";
            const tagsStr = JSON.stringify(p.tags || []);
            const hintsStr = JSON.stringify(p.hints || []);
            const companiesStr = JSON.stringify(p.companies || []);
            const mcqsStr = JSON.stringify(p.mcqs || []);

            // Templates
            const templatesObj = p.templates || {};
            let templatesStr = "{\n";
            for (const [lang, code] of Object.entries(templatesObj)) {
                templatesStr += `            ${lang}: \`${cleanStr(code)}\`,\n`;
            }
            templatesStr += "        }";

            tsContent += `    {
        id: '${p.id}',
        title: \`${cleanStr(p.title)}\`,
        difficulty: '${p.difficulty}',
        description: \`${cleanStr(p.description)}\`,
        inputFormat: \`${cleanStr(p.inputFormat || "See description")}\`,
        outputFormat: \`${cleanStr(p.outputFormat || "See description")}\`,
        constraints: ${constraintsStr},
        testCases: ${testCasesStr},
        tags: ${tagsStr},
        hints: ${hintsStr},
        optimalSolution: ${optimalSolutionStr},
        template: \`${cleanStr(p.template || "")}\`,
        templates: ${templatesStr},
        methodName: '${p.methodName}',
        acceptanceRate: ${p.acceptanceRate || 0},
        frequency: ${p.frequency || 0},
        companies: ${companiesStr},
        mcqs: ${mcqsStr},
        timeComplexity: \`${cleanStr(p.timeComplexity || "")}\`,
        spaceComplexity: \`${cleanStr(p.spaceComplexity || "")}\`
    },
`;
        }

        tsContent += "];\n";

        fs.writeFileSync(output_path, tsContent);
        console.log('Successfully generated src/data/problems.ts');

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

generate();
