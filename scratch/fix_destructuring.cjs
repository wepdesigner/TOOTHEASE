const fs = require('fs');
const path = require('path');

const ppPath = path.join(__dirname, '../src/Pages/Patient/PatientPanel.jsx');
let code = fs.readFileSync(ppPath, 'utf8');

// replace_file_content corrupted lines around 130. 
// Right now, the file has something like:
//   const {
//     patient,
//     doctors,
//   useEffect(() => {
//     const handler = () => refresh();

// We need to restore the full destructuring.
const corrupted = `  const {
    patient,
    doctors,
  useEffect(() => {
    const handler = () => refresh();`;

const fixed = `  const {
    patient,
    doctors,
    appointments,
    prescriptions,
    consultations,
    homeVisits,
    payments,
    messages,
    notifications,
    dentalRecords,
    records,
    loading,
    refresh,
  } = usePatientData(patientId);

  useEffect(() => {
    const handler = () => refresh();`;

if (code.includes(corrupted)) {
  code = code.replace(corrupted, fixed);
  fs.writeFileSync(ppPath, code);
  console.log("Successfully fixed the corrupted destructuring!");
} else {
  // Let's do a more robust search if it didn't match exactly.
  const idx = code.indexOf('const {');
  if (idx !== -1) {
    const useEffectIdx = code.indexOf('useEffect(() => {', idx);
    if (useEffectIdx !== -1) {
      const startText = code.substring(0, idx);
      const endText = code.substring(useEffectIdx);
      const injected = `const {
    patient,
    doctors,
    appointments,
    prescriptions,
    consultations,
    homeVisits,
    payments,
    messages,
    notifications,
    dentalRecords,
    records,
    loading,
    refresh,
  } = usePatientData(patientId);

  `;
      code = startText + injected + endText;
      fs.writeFileSync(ppPath, code);
      console.log("Successfully fixed the corrupted destructuring via index!");
    } else {
      console.log("Could not find useEffect!");
    }
  } else {
    console.log("Could not find const {");
  }
}
