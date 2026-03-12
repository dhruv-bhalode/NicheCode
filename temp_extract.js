global.problems = [
];


const fs = require("fs");
fs.writeFileSync("public/problems.json", JSON.stringify(global.problems, null, 2));
