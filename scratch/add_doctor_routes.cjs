const fs = require('fs');
const path = require('path');

const drPath = path.join(__dirname, '../backend/routes/doctorPanel.routes.js');
let code = fs.readFileSync(drPath, 'utf8');

if (!code.includes('getSOSLogs')) {
  // Extract imports and add the new ones
  const importTarget = `getPatientRecords, createMedicalRecord, updateMedicalRecord, deleteMedicalRecord,`;
  const newImport = `getPatientRecords, createMedicalRecord, updateMedicalRecord, deleteMedicalRecord, getSOSLogs, resolveSOSLog,`;
  code = code.replace(importTarget, newImport);
  
  // Add routes near the end
  const routeTarget = `module.exports = router;`;
  const newRoutes = `
// SOS Post-Op routes
router.get("/sos-logs", getSOSLogs);
router.patch("/sos-logs/:id/resolve", resolveSOSLog);

module.exports = router;`;
  
  code = code.replace(routeTarget, newRoutes);
  
  fs.writeFileSync(drPath, code);
  console.log("Added SOS routes to doctorPanel.routes.js");
} else {
  console.log("Already added");
}
