const fs = require('fs');
const path = require('path');

const ppPath = path.join(__dirname, '../src/Pages/Patient/PatientPanel.jsx');
let code = fs.readFileSync(ppPath, 'utf8');

// 1. Add Imports
if (!code.includes('import AiScanner')) {
  code = code.replace(
    'import JitsiVideoCall from "../../Components/JitsiVideoCall";',
    'import JitsiVideoCall from "../../Components/JitsiVideoCall";\nimport AiScanner from "../../Components/AiScanner";\nimport DentalChart from "../../Components/DentalChart";'
  );
}

// 2. Add dentalRecords fetch
if (!code.includes('await API.get("/users/me/dental-records")')) {
  const fetchRecords = `      try {
        const { data: recs } = await API.get("/users/me/records");
        if (recs?.success) setRecords(recs.records || []);
      } catch (e) { console.error("Failed to fetch records", e); }`;

  const fetchBoth = `      try {
        const { data: recs } = await API.get("/users/me/records");
        if (recs?.success) setRecords(recs.records || []);
      } catch (e) { console.error("Failed to fetch records", e); }

      try {
        const { data: dRecs } = await API.get("/users/me/dental-records");
        if (dRecs?.success) setDentalRecords(dRecs.dentalRecords || []);
      } catch (e) { console.error("Failed to fetch dental records", e); }`;

  code = code.replace(fetchRecords, fetchBoth);
}

// 3. Add ai_scan to the render switch
if (!code.includes("tab === 'ai_scan'")) {
  code = code.replace(
    "{tab === 'my_chart' && <PatMyChart {...sp} dentalRecords={dentalRecords} />}",
    "{tab === 'my_chart' && <PatMyChart {...sp} dentalRecords={dentalRecords} />}\n            {tab === 'ai_scan' && <AiScanner onBookRecommendation={() => setTab(\"book\")} />}"
  );
}

// 4. Add ai_scan to sidebar
if (!code.includes("key: \"ai_scan\"")) {
  code = code.replace(
    '{ key: "my_chart", icon: "ti-dental", label: "My 3D Chart" },',
    '{ key: "my_chart", icon: "ti-dental", label: "My 3D Chart" },\n    { key: "ai_scan", icon: "ti-scan", label: "AI Scanner" },'
  );
}

fs.writeFileSync(ppPath, code);
console.log("Successfully applied all PatientPanel fixes safely!");
