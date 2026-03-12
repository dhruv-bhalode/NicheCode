import fs from 'fs';

async function asyncPool(poolLimit, array, iteratorFn) {
    const ret = [];
    const executing = [];
    for (const item of array) {
        const p = Promise.resolve().then(() => iteratorFn(item, array));
        ret.push(p);
        if (poolLimit <= array.length) {
            const e = p.then(() => executing.splice(executing.indexOf(e), 1));
            executing.push(e);
            if (executing.length >= poolLimit) {
                await Promise.race(executing);
            }
        }
    }
    return Promise.all(ret);
}

const rawBase = 'https://raw.githubusercontent.com/kamyu104/LeetCode-Solutions/master';

async function fetchKAM(slug, langFolder, ext) {
    let url = `${rawBase}/${langFolder}/${slug}.${ext}`;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        let response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (response.ok) {
            return await response.text();
        }
        return null;
    } catch (e) {
        return null;
    }
}

function generateSlug(title) {
    if (!title) return '';
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function processProblem(p) {
    let slug = p.titleSlug || p.slug || generateSlug(p.title);
    if (!slug) return false;

    let py = await fetchKAM(slug, 'Python', 'py') || await fetchKAM(slug, 'Python3', 'py');
    let cpp = await fetchKAM(slug, 'C++', 'cpp');
    let java = await fetchKAM(slug, 'Java', 'java');

    let sql = await fetchKAM(slug, 'MySQL', 'sql');
    let bash = await fetchKAM(slug, 'Bash', 'sh');
    let pandas = await fetchKAM(slug, 'Pandas', 'py');

    if (py || cpp || java || sql || bash || pandas) {
        if (!p.optimalSolution || !Array.isArray(p.optimalSolution)) {
            p.optimalSolution = [
                { language: 'python', code: '' },
                { language: 'cpp', code: '' },
                { language: 'java', code: '' }
            ];
        }

        p.optimalSolution.forEach(sol => {
            if (sol.language === 'python') {
                if (py) sol.code = py;
                else if (pandas) sol.code = pandas;
            }
            if (sol.language === 'cpp' && cpp) sol.code = cpp;
            if (sol.language === 'java' && java) sol.code = java;

            if (!py && !cpp && !java) {
                if (sql) {
                    sol.code = `-- SQL Solution:\n${sql}`;
                } else if (bash) {
                    sol.code = `# Bash Solution:\n${bash}`;
                }
            }
        });

        if (sql && !py && !cpp && !java) {
            p.optimalSolution = [
                { language: 'mysql', code: sql },
                { language: 'python', code: `# Not strictly python. SQL equivalent:\n${sql}` }
            ];
        }

        return true;
    }
    return false;
}

async function main() {
    const jsonPath = 'server/exports/display-problems.json';
    const problems = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const missingFile = JSON.parse(fs.readFileSync('missing_136.json', 'utf-8'));

    const missingIds = new Set(missingFile.map(m => String(m.id)));

    let toProcess = problems.filter(p => missingIds.has(String(p.id)) || missingIds.has(String(p.questionFrontendId)));
    console.log(`Processing ${toProcess.length} remaining missing problems...`);
    let count_scraped = 0;

    await asyncPool(10, toProcess, async (p) => {
        if (await processProblem(p)) {
            count_scraped++;
        }
    });

    console.log(`Successfully fetched ${count_scraped} more missing solutions.`);
    fs.writeFileSync(jsonPath, JSON.stringify(problems, null, 2));
    fs.writeFileSync('server/exports/display-problems_updated.json', JSON.stringify(problems, null, 2));
}

main();
