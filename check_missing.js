import fs from 'fs';

function checkRemaining() {
    const data = JSON.parse(fs.readFileSync('server/exports/display-problems.json', 'utf-8'));
    const missing = [];

    for (let p of data) {
        if (!p.optimalSolution || !Array.isArray(p.optimalSolution)) {
            missing.push({ id: p.questionFrontendId || p.id, title: p.title, slug: p.titleSlug });
            continue;
        }

        const py = p.optimalSolution.find(s => s.language === 'python');
        const pyCode = py ? py.code : "";

        if (pyCode.includes('    pass\n') || pyCode.trim() === '' || JSON.stringify(p.optimalSolution).includes('UnsupportedOperationException')) {
            missing.push({ id: p.questionFrontendId || p.id, title: p.title, slug: p.titleSlug });
        }
    }

    console.log(`Total missing: ${missing.length}`);
    console.log(JSON.stringify(missing.slice(0, 20), null, 2));

    fs.writeFileSync('missing_136.json', JSON.stringify(missing, null, 2));
}

checkRemaining();
