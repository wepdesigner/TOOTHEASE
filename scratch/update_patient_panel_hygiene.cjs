const fs = require('fs');
const path = require('path');

const ppPath = path.join(__dirname, '../src/Pages/Patient/PatientPanel.jsx');
let ppCode = fs.readFileSync(ppPath, 'utf8');

if (!ppCode.includes('HygieneTracker')) {
  // 1. Add import
  ppCode = ppCode.replace(
    'import RecoveryMonitor from "../../Components/RecoveryMonitor";',
    'import RecoveryMonitor from "../../Components/RecoveryMonitor";\nimport HygieneTracker from "../../Components/HygieneTracker";'
  );

  // 2. Add to NAV
  ppCode = ppCode.replace(
    '{ key: "records", icon: "ti-clipboard-heart", label: "Medical Records" },',
    '{ key: "records", icon: "ti-clipboard-heart", label: "Medical Records" },\n  { key: "hygiene", icon: "ti-trophy", label: "Habits & Rewards" },'
  );

  // 3. Add to renderer
  ppCode = ppCode.replace(
    "{tab === 'records' && <PatRecords {...sp} records={records} />}",
    "{tab === 'records' && <PatRecords {...sp} records={records} />}\n          {tab === 'hygiene' && <HygieneTracker />}"
  );

  fs.writeFileSync(ppPath, ppCode);
  console.log("Updated PatientPanel.jsx with HygieneTracker.");
} else {
  console.log("PatientPanel.jsx already updated.");
}
