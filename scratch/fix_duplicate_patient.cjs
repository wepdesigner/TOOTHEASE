const fs = require('fs');
const path = require('path');

const ppPath = path.join(__dirname, '../src/Pages/Patient/PatientPanel.jsx');
let lines = fs.readFileSync(ppPath, 'utf8').split('\n');

if (lines[256].includes('getSessionPatientId = () =>')) {
  lines.splice(256, 152); 
  fs.writeFileSync(ppPath, lines.join('\n'));
  console.log("Fixed duplicate code in PatientPanel.jsx");
} else {
  console.log("Lines do not match expected pattern, not modifying.");
}
