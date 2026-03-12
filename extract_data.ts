import fs from 'fs';
import path from 'path';
import { problems } from './src/data/problems';

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}

const outputPath = path.join(publicDir, 'problems.json');

console.log(`Extracting ${problems.length} problems to ${outputPath}...`);

fs.writeFileSync(outputPath, JSON.stringify(problems, null, 2), 'utf-8');

console.log('Extraction complete!');
