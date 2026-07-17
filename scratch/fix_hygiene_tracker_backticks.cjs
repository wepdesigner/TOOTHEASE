const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/Components/HygieneTracker.jsx');
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(/\\\`/g, '`');
code = code.replace(/\\\$/g, '$');

fs.writeFileSync(filePath, code);
console.log("Fixed backticks in HygieneTracker.jsx.");
