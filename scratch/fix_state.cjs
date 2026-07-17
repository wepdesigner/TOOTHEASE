const fs = require('fs');
const path = require('path');

const ppPath = path.join(__dirname, '../src/Pages/Patient/PatientPanel.jsx');
let code = fs.readFileSync(ppPath, 'utf8');

const missingBlock = `  const [sideOpen, setSide] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeVideoCall, setActiveVideoCall] = useState(null);

  const showToast = useCallback((msg, type = 'success') => setToast({ msg, type }), []);

  const {
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
    const handler = () => refresh();
    window.addEventListener('stech_refresh', handler);
    return () => window.removeEventListener('stech_refresh', handler);
  }, [refresh]);`;

// Right now the file has:
//   const [tab, setTab] = useState('overview');
// 
//   useEffect(() => {
//     const t = setInterval(refresh, 5000);

const targetStr = `  const [tab, setTab] = useState('overview');

  useEffect(() => {
    const t = setInterval(refresh, 5000);`;

const newStr = `  const [tab, setTab] = useState('overview');
${missingBlock}

  useEffect(() => {
    const t = setInterval(refresh, 5000);`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, newStr);
  fs.writeFileSync(ppPath, code);
  console.log("Successfully restored the missing component states and destructuring!");
} else {
  // Try another anchor
  const altAnchor = `  const [tab, setTab] = useState('overview');\r\n\r\n  useEffect(() => {`;
  if (code.includes(altAnchor)) {
    code = code.replace(altAnchor, newStr.replace(/\n/g, '\r\n'));
    fs.writeFileSync(ppPath, code);
    console.log("Successfully restored the missing component states (CRLF)!");
  } else {
    // manual index injection
    const idx = code.indexOf(`const [tab, setTab] = useState('overview');`);
    if (idx !== -1) {
      const effectIdx = code.indexOf(`useEffect(() => {`, idx);
      if (effectIdx !== -1) {
         const pre = code.substring(0, idx + `const [tab, setTab] = useState('overview');`.length);
         const post = code.substring(effectIdx);
         code = pre + '\n' + missingBlock + '\n\n  ' + post;
         fs.writeFileSync(ppPath, code);
         console.log("Successfully restored via manual index slice!");
      }
    } else {
      console.log("Could not find anchor!");
    }
  }
}
