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

// 2. Fix the entire usePatientData hook to include dentalRecords properly
const newHook = `/** Custom hook to fetch all patient-related data from API */
function usePatientData(patientId) {
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [homeVisits, setHomeVisits] = useState([]);
  const [payments, setPayments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [dentalRecords, setDentalRecords] = useState([]);
  const [records, setRecords] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      let patientData = null;
      try {
        const { data: profile } = await API.get("/auth/me");
        if (profile?.success) {
          patientData = profile.user;
        }
      } catch (e) { console.error("Failed to fetch profile", e); }

      setPatient(patientData);

      // Fetch from API
      try {
        const { data: docs } = await API.get("/doctors");
        if (docs?.success) setDoctors(docs.doctors || []);
      } catch (e) { console.error("Failed to fetch doctors", e); }

      try {
        const { data: appts } = await API.get("/appointments/my");
        if (appts?.success) {
           setAppointments(appts.appointments || []);
        }
      } catch (e) { console.error("Failed to fetch appointments", e); }

      try {
        const { data: cons } = await API.get("/users/me/consultations");
        if (cons?.success) setConsultations(cons.consultations || []);
      } catch (e) { console.error(e); }

      try {
        const { data: hv } = await API.get("/users/me/home-visits");
        if (hv?.success) setHomeVisits(hv.homeVisits || []);
      } catch (e) { console.error(e); }

      try {
        const { data: prescr } = await API.get("/users/me/prescriptions");
        if (prescr?.success) setPrescriptions(prescr.prescriptions || []);
      } catch (e) { console.error("Failed to fetch prescriptions", e); }

      try {
        const { data: recs } = await API.get("/users/me/records");
        if (recs?.success) setRecords(recs.records || []);
      } catch (e) { console.error("Failed to fetch records", e); }

      try {
        const { data: dRecs } = await API.get("/users/me/dental-records");
        if (dRecs?.success) setDentalRecords(dRecs.dentalRecords || []);
      } catch (e) { console.error("Failed to fetch dental records", e); }

      try {
        const { data: pays } = await API.get("/users/me/payments");
        if (pays?.success) setPayments(pays.payments || []);
      } catch (e) { console.error("Failed to fetch payments", e); }

      try {
        const { data: notifs } = await API.get("/users/me/notifications");
        if (notifs?.success) setNotifications(notifs.notifications || []);
      } catch (e) { console.error("Failed to fetch notifications", e); }
      
      setMessages([]); // Messaging API not fully implemented yet, avoid mock crash

    } catch (err) {
      console.error('Error loading patient data', err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    const t = setInterval(fetchAll, 5000);
    return () => clearInterval(t);
  }, [fetchAll]);

  return { patient, doctors, appointments, prescriptions, consultations, homeVisits, payments, messages, notifications, dentalRecords, records, loading, refresh: fetchAll };
}
`;

const startIndex = code.indexOf('/** Custom hook to fetch all patient-related data from API */');
const endIndex = code.indexOf('/** Helper to get logged-in user ID from localStorage */');

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + newHook + '\n' + code.substring(endIndex);
}

// 3. Fix the destructuring in PatientPanel
const brokenDestructuring = `  const {
    patient,
    doctors,
    appointments,
    prescriptions,
    consultations,
    homeVisits,
    payments,
    messages,
    notifications,
    records,
    loading,
    refresh,
  } = usePatientData(patientId);`;

const fixedDestructuring = `  const {
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
  } = usePatientData(patientId);`;

code = code.replace(brokenDestructuring, fixedDestructuring);

// 4. Add ai_scan to the render switch
if (!code.includes("tab === 'ai_scan'")) {
  code = code.replace(
    "{tab === 'my_chart' && <PatMyChart {...sp} dentalRecords={dentalRecords} />}",
    "{tab === 'my_chart' && <PatMyChart {...sp} dentalRecords={dentalRecords} />}\n            {tab === 'ai_scan' && <AiScanner onBookRecommendation={() => setTab(\"book\")} />}"
  );
}

// 5. Add ai_scan to sidebar
if (!code.includes("key: \"ai_scan\"")) {
  code = code.replace(
    '{ key: "my_chart", icon: "ti-dental", label: "My 3D Chart" },',
    '{ key: "my_chart", icon: "ti-dental", label: "My 3D Chart" },\n    { key: "ai_scan", icon: "ti-scan", label: "AI Scanner" },'
  );
}

fs.writeFileSync(ppPath, code);
console.log("Successfully rebuilt everything safely!");
