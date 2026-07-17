const fs = require('fs');
const path = require('path');

const ppPath = path.join(__dirname, '../src/Pages/Patient/PatientPanel.jsx');
let ppCode = fs.readFileSync(ppPath, 'utf8');

// The file currently starts with:
//   const [patient, setPatient] = useState(null);
// We need to restore lines 1 to 14

const newTop = `// PatientPanel.jsx - API backed implementation
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../services/api';
import '../Styles/patient.css';
import JitsiVideoCall from "../../Components/JitsiVideoCall";
import AiScanner from "../../Components/AiScanner";
import DentalChart from "../../Components/DentalChart";

const uid = () => Math.random().toString(36).slice(2, 10);

/** Custom hook to fetch all patient-related data from API */
function usePatientData(patientId) {
`;

// Wait, the replace_file_content tool removed lines 1-14 but did it leave `const [patient, setPatient] = useState(null);` at the very beginning of the file?
// Let's check if the file starts with whitespace and then `const [patient`.
const pIndex = ppCode.indexOf('const [patient, setPatient]');

if (pIndex !== -1) {
  // Replace everything before pIndex with newTop
  ppCode = newTop + "  " + ppCode.substring(pIndex);
  fs.writeFileSync(ppPath, ppCode);
  console.log("Successfully fixed PatientPanel.jsx imports and restored lines!");
} else {
  console.log("Could not find 'const [patient, setPatient]'");
}
