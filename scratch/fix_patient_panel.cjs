const fs = require('fs');
const path = require('path');

const ppPath = path.join(__dirname, '../src/Pages/Patient/PatientPanel.jsx');
let ppCode = fs.readFileSync(ppPath, 'utf8');

const target = `    const sess = JSON.parse(localStorage.getItem("stech_session"));
  const {
    patient,`;

const replacement = `    const sess = JSON.parse(localStorage.getItem("stech_session"));
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
    patient,`;

ppCode = ppCode.replace(target, replacement);

fs.writeFileSync(ppPath, ppCode);
console.log("Fixed PatientPanel.jsx and restored getSessionPatientId and PatientPanel function.");
