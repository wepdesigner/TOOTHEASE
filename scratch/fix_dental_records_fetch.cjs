const fs = require('fs');
const path = require('path');

const ppPath = path.join(__dirname, '../src/Pages/Patient/PatientPanel.jsx');
let ppCode = fs.readFileSync(ppPath, 'utf8');

const t = 'const { data: recs } = await API.get("/users/me/records");';
const i = ppCode.indexOf(t);

if (i !== -1) {
  // find the end of the catch block
  const endCatch = ppCode.indexOf('}', i);
  if (endCatch !== -1) {
    const fetchStr = `
      try {
        const { data: dRecs } = await API.get("/users/me/dental-records");
        if (dRecs?.success) setDentalRecords(dRecs.dentalRecords || []);
      } catch (e) { console.error("Failed to fetch dental records", e); }
`;
    ppCode = ppCode.substring(0, endCatch + 1) + fetchStr + ppCode.substring(endCatch + 1);
    fs.writeFileSync(ppPath, ppCode);
    console.log("Successfully injected dental records fetch via indexOf!");
  }
} else {
  console.log("Could not find the target fetch block via indexOf!");
}
