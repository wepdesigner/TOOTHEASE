const fs = require('fs');
const path = require('path');

// 1. Update user.controller.js
const ucPath = path.join(__dirname, '../backend/controllers/user.controller.js');
let ucCode = fs.readFileSync(ucPath, 'utf8');

const newMethods = `
const updateMyAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const Appointment = require("../models/Appointment");
    const appt = await Appointment.findOneAndUpdate(
      { _id: req.params.id, patientId: req.user._id },
      { status },
      { new: true }
    );
    if (!appt) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, appointment: appt });
  } catch (err) { res.status(500).json({ success: false, message: "Server error" }); }
};
`;

ucCode = ucCode.replace(
  'const updateMyHomeVisitStatus = async (req, res) => {',
  newMethods + '\nconst updateMyHomeVisitStatus = async (req, res) => {'
);
ucCode = ucCode.replace(
  'updateMyHomeVisitStatus,',
  'updateMyHomeVisitStatus,\n  updateMyAppointmentStatus,'
);
fs.writeFileSync(ucPath, ucCode);

// 2. Update user.routes.js
const urPath = path.join(__dirname, '../backend/routes/user.routes.js');
let urCode = fs.readFileSync(urPath, 'utf8');
urCode = urCode.replace(
  'updateMyHomeVisitStatus, ',
  'updateMyHomeVisitStatus, updateMyAppointmentStatus, '
);
urCode = urCode.replace(
  'module.exports = router;',
  'router.patch("/me/appointments/:id/status", protect, updateMyAppointmentStatus);\n\nmodule.exports = router;'
);
fs.writeFileSync(urPath, urCode);

// 3. Update PatientPanel.jsx
const ppPath = path.join(__dirname, '../src/Pages/Patient/PatientPanel.jsx');
let ppCode = fs.readFileSync(ppPath, 'utf8');

const patApptTop = 'function PatAppointments({ items, setTab, onJoinCall }) {\n    const [filter, setFilter] = useState(\'all\');';
const patApptNewTop = `function PatAppointments({ items, setTab, onJoinCall, refresh, showToast }) {
    const [filter, setFilter] = useState('all');
    const handleUpdate = async (id, status) => {
      try {
        await API.patch(\`/users/me/appointments/\${id}/status\`, { status });
        if (showToast) showToast(status === "CONFIRMED" ? "Accepted" : "Declined", "success");
        if (refresh) refresh();
      } catch(e) { if (showToast) showToast("Failed to update", "error"); }
    };`;
ppCode = ppCode.replace(patApptTop, patApptNewTop);

// Need to pass refresh & showToast to PatAppointments in PatientPanel main
ppCode = ppCode.replace(
  '{tab === \'appointments\' && <PatAppointments {...sp} \nitems={appointments} />}',
  '{tab === \'appointments\' && <PatAppointments {...sp} items={appointments} refresh={refresh} showToast={showToast} />}'
);
// Also catch the one-line version just in case
ppCode = ppCode.replace(
  '{tab === \'appointments\' && <PatAppointments {...sp} items={appointments} />}',
  '{tab === \'appointments\' && <PatAppointments {...sp} items={appointments} refresh={refresh} showToast={showToast} />}'
);


// Replace the buttons in PatAppointments
const patApptAction = "{isVideo && (a.status==='scheduled' || a.status==='confirmed' || a.status==='pending' || a.status==='PENDING') && <button onClick={() => onJoinCall(a.roomId || a._id || a.id)} className=\"pp-btn pp-btn-primary pp-btn-sm\" style={{textDecoration:'none', border: 'none', cursor: 'pointer'}}><i className=\"ti ti-video\"/> Join Call</button>}";
const patApptActionNew = `
                {a.status === 'PENDING' && <div style={{display:"inline-flex", gap:6, marginRight:10}}>
                  <button className="pp-btn" style={{background:"#e6f4ea",color:"#137333",padding:"6px 12px",fontSize:13}} onClick={()=>handleUpdate(a._id||a.id, "CONFIRMED")}>Accept</button>
                  <button className="pp-btn" style={{background:"#fce8e6",color:"#c5221f",padding:"6px 12px",fontSize:13}} onClick={()=>handleUpdate(a._id||a.id, "CANCELLED")}>Reject</button>
                </div>}
                {isVideo && ['scheduled','confirmed','CONFIRMED','accepted','APPROVED'].includes(a.status) && <button onClick={() => onJoinCall(a.roomId || a._id || a.id)} className="pp-btn pp-btn-primary pp-btn-sm" style={{textDecoration:'none', border: 'none', cursor: 'pointer'}}><i className="ti ti-video"/> Join Call</button>}
`;
ppCode = ppCode.replace(patApptAction, patApptActionNew);

fs.writeFileSync(ppPath, ppCode);

console.log("Patient Appointment patching complete.");
