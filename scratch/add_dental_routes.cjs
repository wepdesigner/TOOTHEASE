const fs = require('fs');
const path = require('path');

const pPath = path.join(__dirname, '../backend/routes/doctorPanel.routes.js');
let code = fs.readFileSync(pPath, 'utf8');

if (!code.includes('createDentalRecord')) {
  // Add the import from doctor.controller.js at the top
  const importStatement = `const { getPatientDentalRecords, createDentalRecord } = require("../controllers/doctor.controller");\n`;
  
  // Insert right after express require
  code = code.replace('const express = require("express");', 'const express = require("express");\n' + importStatement);
  
  // Add the routes near the other records routes
  const routesStr = `router.get("/patients/:patientId/dental-records", getPatientDentalRecords);
router.post("/dental-records", createDentalRecord);

router.get("/records/:patientId", getPatientRecords);`;
  
  code = code.replace('router.get("/records/:patientId", getPatientRecords);', routesStr);
  
  fs.writeFileSync(pPath, code);
  console.log("Added dental routes to doctorPanel.routes.js!");
} else {
  console.log("Routes already exist in doctorPanel.routes.js!");
}
