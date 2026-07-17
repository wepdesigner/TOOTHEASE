const fs = require('fs');
const path = require('path');

// ==========================================
// 1. UPDATE DOCTOR PANEL
// ==========================================
const dpPath = path.join(__dirname, '../src/Pages/Doctor/ApiDoctorPanel.jsx');
let dpCode = fs.readFileSync(dpPath, 'utf8');

// A. DocAppointments: Change new appointment creation to status PENDING
dpCode = dpCode.replace(
  'await API.post("/doctor/appointments",{...fm,status:"CONFIRMED"});toast("Created!");',
  'await API.post("/doctor/appointments",{...fm,status:"PENDING"});toast("Created Request!");'
);

// B. DocConsultations: Change creation to status pending
dpCode = dpCode.replace(
  'await API.post("/doctor/consultations",{...fm,doctorInitiated:true});toast("Scheduled!");',
  'await API.post("/doctor/consultations",{...fm,doctorInitiated:true,status:"pending"});toast("Created Request!");'
);
// In DocConsultations, add accept/reject buttons for pending
const consOldAction = '{c.status==="scheduled"&&<button className="dp-btn-primary" style={{padding:"6px 14px",fontSize:12}} onClick={()=>onStartCall(c)}>Join</button>}{c.status==="completed"&&<Badge label="Done" color="#22c55e"/>}';
// Need to add `up` method to DocConsultations
const docConsStart = 'function DocConsultations({toast,onStartCall}){const[i,setI]=useState([]);';
const docConsStartNew = 'function DocConsultations({toast,onStartCall}){const[i,setI]=useState([]);const up=async(id,s)=>{try{await API.patch(`/doctor/consultations/${id}`,{status:s});toast(s==="accepted"?"Accepted":`${s}`);ref();}catch{toast("Failed","error");}};'
dpCode = dpCode.replace(docConsStart, docConsStartNew);

const consNewAction = '{c.status==="pending"&&<div style={{display:"flex",gap:6}}><button className="dp-ghost" style={{color:"#22c55e"}} onClick={()=>up(c.id||c._id,"accepted")}>Accept</button><button className="dp-ghost" style={{color:"#ef4444"}} onClick={()=>up(c.id||c._id,"declined")}>Reject</button></div>}{(c.status==="scheduled"||c.status==="accepted")&&<button className="dp-btn-primary" style={{padding:"6px 14px",fontSize:12}} onClick={()=>onStartCall(c)}>Join</button>}{c.status==="completed"&&<Badge label="Done" color="#22c55e"/>}';
dpCode = dpCode.replace(consOldAction, consNewAction);

fs.writeFileSync(dpPath, dpCode);

// ==========================================
// 2. UPDATE PATIENT PANEL
// ==========================================
const ppPath = path.join(__dirname, '../src/Pages/Patient/PatientPanel.jsx');
let ppCode = fs.readFileSync(ppPath, 'utf8');

// Add a helper function for updating status in PatConsultations
const patConsTop = 'function PatConsultations({ consultations, onJoinCall, refresh, showToast }) {\n  const handleDelete = async (id) => {';
const patConsNewTop = `function PatConsultations({ consultations, onJoinCall, refresh, showToast }) {
  const handleUpdate = async (id, status) => {
    try {
      await API.patch(\`/users/me/consultations/\${id}/status\`, { status });
      if (showToast) showToast(status === "accepted" ? "Accepted" : "Declined", "success");
      if (refresh) refresh();
    } catch(e) { if (showToast) showToast("Failed to update", "error"); }
  };
  const handleDelete = async (id) => {`;
ppCode = ppCode.replace(patConsTop, patConsNewTop);

// Update PatConsultations actions
const patConsAction = '<button className="pp-btn pp-btn-primary" disabled={c.status !== "APPROVED"} onClick={() => onJoinCall(c.roomId || c._id || c.id)}>Join Call <i className="ti ti-video" style={{marginLeft: 8}}/></button>';
const patConsActionNew = `
                    {c.status === "pending" && <div style={{display:"inline-flex", gap:6, marginRight:10}}>
                      <button className="pp-btn" style={{background:"#e6f4ea",color:"#137333",padding:"6px 12px",fontSize:13}} onClick={()=>handleUpdate(c._id||c.id, "accepted")}>Accept</button>
                      <button className="pp-btn" style={{background:"#fce8e6",color:"#c5221f",padding:"6px 12px",fontSize:13}} onClick={()=>handleUpdate(c._id||c.id, "declined")}>Reject</button>
                    </div>}
                    <button className="pp-btn pp-btn-primary" disabled={!["APPROVED","CONFIRMED","scheduled","accepted"].includes(c.status?.toUpperCase() || c.status)} onClick={() => onJoinCall(c.roomId || c._id || c.id)}>Join Call <i className="ti ti-video" style={{marginLeft: 8}}/></button>
`;
ppCode = ppCode.replace(patConsAction, patConsActionNew);

// Add a helper function for updating status in PatHomeVisit
const patHvTop = 'function PatHomeVisit({ homeVisits }) {\n  const navigate = useNavigate();';
const patHvNewTop = `function PatHomeVisit({ homeVisits, refresh, showToast }) {
  const navigate = useNavigate();
  const handleUpdate = async (id, status) => {
    try {
      await API.patch(\`/users/me/home-visits/\${id}/status\`, { status });
      if (showToast) showToast(status === "accepted" ? "Accepted" : "Declined", "success");
      if (refresh) refresh();
    } catch(e) { if (showToast) showToast("Failed to update", "error"); }
  };`;
ppCode = ppCode.replace(patHvTop, patHvNewTop);

// Need to pass refresh & showToast to PatHomeVisit in PatientPanel main
ppCode = ppCode.replace(
  '{tab === \'home_visit\' && <PatHomeVisit {...sp} homeVisits={combinedHomeVisits} />}',
  '{tab === \'home_visit\' && <PatHomeVisit {...sp} homeVisits={combinedHomeVisits} refresh={refresh} showToast={showToast} />}'
);

// Update PatHomeVisit actions
// Wait, currently PatHomeVisit doesn't have an action column. I should add it.
const patHvThead = '<th style={{ padding: 16 }}>Status</th>\n              </tr>';
const patHvTheadNew = '<th style={{ padding: 16 }}>Status</th>\n                <th style={{ padding: 16, textAlign: "right" }}>Action</th>\n              </tr>';
ppCode = ppCode.replace(patHvThead, patHvTheadNew);

const patHvTbody = '<td style={{ padding: 16 }}><span style={{ padding: "4px 8px", borderRadius: 12, fontSize: 12, background: hv.status==="APPROVED"?"#e6f4ea":"#fef7e0", color: hv.status==="APPROVED"?"#137333":"#b06000", fontWeight: 600 }}>{hv.status}</span></td>\n                </tr>';
const patHvTbodyNew = `<td style={{ padding: 16 }}><span style={{ padding: "4px 8px", borderRadius: 12, fontSize: 12, background: (hv.status==="APPROVED"||hv.status==="accepted"||hv.status==="CONFIRMED")?"#e6f4ea":"#fef7e0", color: (hv.status==="APPROVED"||hv.status==="accepted"||hv.status==="CONFIRMED")?"#137333":"#b06000", fontWeight: 600 }}>{hv.status}</span></td>
                  <td style={{ padding: 16, textAlign: "right" }}>
                    {hv.status === "pending" && <div style={{display:"inline-flex", gap:6}}>
                      <button className="pp-btn" style={{background:"#e6f4ea",color:"#137333",padding:"6px 12px",fontSize:13}} onClick={()=>handleUpdate(hv._id||hv.id, "accepted")}>Accept</button>
                      <button className="pp-btn" style={{background:"#fce8e6",color:"#c5221f",padding:"6px 12px",fontSize:13}} onClick={()=>handleUpdate(hv._id||hv.id, "declined")}>Reject</button>
                    </div>}
                  </td>
                </tr>`;
ppCode = ppCode.replace(patHvTbody, patHvTbodyNew);

fs.writeFileSync(ppPath, ppCode);

console.log("Panels updated successfully.");
