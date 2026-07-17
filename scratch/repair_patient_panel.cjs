const fs = require('fs');
const path = require('path');

const ppPath = path.join(__dirname, '../src/Pages/Patient/PatientPanel.jsx');
let lines = fs.readFileSync(ppPath, 'utf8').split('\n');

const correctChunk = `
/** Helper to get logged-in user ID from localStorage */
const getSessionPatientId = () => {
  try {
    const cur = JSON.parse(localStorage.getItem("stech_current_user"));
    if (cur && cur.role === "patient") return cur.id || cur._id;
  } catch {}
  try {
    const sess = JSON.parse(localStorage.getItem("stech_session"));
    if (sess && (sess.role === "patient" || sess.role === "PATIENT")) return sess.id || sess._id;
  } catch {}
  return null;
};

/** Main PatientPanel component */
export default function PatientPanel({ patientId: propPatientId, onLogout }) {
  const navigate = useNavigate();
  const { patientId: urlPatientId } = useParams();
  const patientId = propPatientId || urlPatientId || getSessionPatientId();
  const [tab, setTab] = useState('overview');
  const [sideOpen, setSide] = useState(false);
  const [membershipPlan, setMembershipPlan] = useState("Basic");
  const [toast, setToast] = useState(null);
  const [activeVideoCall, setActiveVideoCall] = useState(null);

  const showToast = useCallback((msg, type = 'success') => setToast({ msg, type }), []);

  const {
    patient,
    doctors,
    appointments,
    prescriptions,
    consultations,
    homeVisits,`;

// Find where `return { patient, ... refresh: fetchAll };` is
const returnIndex = lines.findIndex(l => l.includes('refresh: fetchAll };'));
const paymentsIndex = lines.findIndex(l => l.trim() === 'payments,');

if (returnIndex !== -1 && paymentsIndex !== -1) {
  const newCode = [
    ...lines.slice(0, returnIndex + 2),
    correctChunk,
    ...lines.slice(paymentsIndex)
  ].join('\n');
  fs.writeFileSync(ppPath, newCode);
  console.log("PatientPanel.jsx repaired!");
} else {
  console.log("Could not find anchor lines");
}
