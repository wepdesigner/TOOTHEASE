const fs = require('fs');
const path = require('path');

const ctrlPath = path.join(__dirname, '../backend/controllers/user.controller.js');
let ctrlCode = fs.readFileSync(ctrlPath, 'utf8');

ctrlCode = ctrlCode.replace('exports.logHygieneActivity = async', 'module.exports.logHygieneActivity = async');
ctrlCode = ctrlCode.replace('exports.getHygieneStats = async', 'module.exports.getHygieneStats = async');

fs.writeFileSync(ctrlPath, ctrlCode);
console.log("Fixed exports in user.controller.js.");
