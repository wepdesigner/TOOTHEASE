const fs = require('fs');
const path = require('path');

const ppPath = path.join(__dirname, '../src/Pages/Patient/PatientPanel.jsx');
let ppCode = fs.readFileSync(ppPath, 'utf8');

// ==========================================
// 1. Fix PatAppointments Filter Bug
// ==========================================
ppCode = ppCode.replace(
  "(filter === 'all' || a.status === filter)",
  "(filter === 'all' || a.status?.toLowerCase() === filter.toLowerCase())"
);

// ==========================================
// 2. Fix PatConsultations Delete and Join / Status Update
// ==========================================

const patConsOldTop = `function PatConsultations({ consultations, onJoinCall, refresh, showToast }) {
  const handleUpdate = async (id, status) => {
    try {
      await API.patch(\`/users/me/consultations/\${id}/status\`, { status });
      if (showToast) showToast(status === "accepted" ? "Accepted" : "Declined", "success");
      if (refresh) refresh();
    } catch(e) { if (showToast) showToast("Failed to update", "error"); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this consultation?")) return;
    try {
      await API.delete(\`/users/me/consultations/\${id}\`);
      if (showToast) showToast("Deleted successfully", "success");
      if (refresh) refresh();
    } catch(e) {
      if (showToast) showToast("Failed to delete", "error");
    }
  };`;

const patConsNewTop = `function PatConsultations({ consultations, onJoinCall, refresh, showToast }) {
  const handleUpdate = async (item, status) => {
    try {
      const isAppt = item.healthType !== undefined;
      const url = isAppt ? \`/users/me/appointments/\${item._id||item.id}/status\` : \`/users/me/consultations/\${item._id||item.id}/status\`;
      const finalStatus = isAppt ? (status === "accepted" ? "CONFIRMED" : "CANCELLED") : status;
      await API.patch(url, { status: finalStatus });
      if (showToast) showToast(status === "accepted" ? "Accepted" : "Declined", "success");
      if (refresh) refresh();
    } catch(e) { if (showToast) showToast("Failed to update", "error"); }
  };
  const handleDelete = async (item) => {
    if (!window.confirm("Delete this consultation?")) return;
    try {
      const isAppt = item.healthType !== undefined;
      const url = isAppt ? \`/users/me/appointments/\${item._id||item.id}\` : \`/users/me/consultations/\${item._id||item.id}\`;
      await API.delete(url);
      if (showToast) showToast("Deleted successfully", "success");
      if (refresh) refresh();
    } catch(e) {
      if (showToast) showToast("Failed to delete", "error");
    }
  };`;
ppCode = ppCode.replace(patConsOldTop, patConsNewTop);

// Update calls in PatConsultations
const consActionOld = `
                    {c.status === "pending" && <div style={{display:"inline-flex", gap:6, marginRight:10}}>
                      <button className="pp-btn" style={{background:"#e6f4ea",color:"#137333",padding:"6px 12px",fontSize:13}} onClick={()=>handleUpdate(c._id||c.id, "accepted")}>Accept</button>
                      <button className="pp-btn" style={{background:"#fce8e6",color:"#c5221f",padding:"6px 12px",fontSize:13}} onClick={()=>handleUpdate(c._id||c.id, "declined")}>Reject</button>
                    </div>}
                    <button className="pp-btn pp-btn-primary" disabled={!["APPROVED","CONFIRMED","scheduled","accepted"].includes(c.status?.toUpperCase() || c.status)} onClick={() => onJoinCall(c.roomId || c._id || c.id)}>Join Call <i className="ti ti-video" style={{marginLeft: 8}}/></button>
`;

const consActionNew = `
                    {c.status?.toLowerCase() === "pending" && <div style={{display:"inline-flex", gap:6, marginRight:10}}>
                      <button className="pp-btn" style={{background:"#e6f4ea",color:"#137333",padding:"6px 12px",fontSize:13}} onClick={()=>handleUpdate(c, "accepted")}>Accept</button>
                      <button className="pp-btn" style={{background:"#fce8e6",color:"#c5221f",padding:"6px 12px",fontSize:13}} onClick={()=>handleUpdate(c, "declined")}>Reject</button>
                    </div>}
                    <button className="pp-btn pp-btn-primary" disabled={!["APPROVED","CONFIRMED","SCHEDULED","ACCEPTED"].includes(c.status?.toUpperCase())} onClick={() => onJoinCall(c.roomId || c._id || c.id)}>Join Call <i className="ti ti-video" style={{marginLeft: 8}}/></button>
`;
ppCode = ppCode.replace(consActionOld, consActionNew);

const consDelOld = 'onClick={() => handleDelete(c._id || c.id)}>Delete</button>';
const consDelNew = 'onClick={() => handleDelete(c)}>Delete</button>';
ppCode = ppCode.replace(consDelOld, consDelNew);


// ==========================================
// 3. Fix PatHomeVisit Delete and Status Update
// ==========================================

const patHvOldTop = `function PatHomeVisit({ homeVisits, refresh, showToast }) {
  const navigate = useNavigate();
  const handleUpdate = async (id, status) => {
    try {
      await API.patch(\`/users/me/home-visits/\${id}/status\`, { status });
      if (showToast) showToast(status === "accepted" ? "Accepted" : "Declined", "success");
      if (refresh) refresh();
    } catch(e) { if (showToast) showToast("Failed to update", "error"); }
  };`;

const patHvNewTop = `function PatHomeVisit({ homeVisits, refresh, showToast }) {
  const navigate = useNavigate();
  const handleUpdate = async (item, status) => {
    try {
      const isAppt = item.healthType !== undefined;
      const url = isAppt ? \`/users/me/appointments/\${item._id||item.id}/status\` : \`/users/me/home-visits/\${item._id||item.id}/status\`;
      const finalStatus = isAppt ? (status === "accepted" ? "CONFIRMED" : "CANCELLED") : status;
      await API.patch(url, { status: finalStatus });
      if (showToast) showToast(status === "accepted" ? "Accepted" : "Declined", "success");
      if (refresh) refresh();
    } catch(e) { if (showToast) showToast("Failed to update", "error"); }
  };`;
ppCode = ppCode.replace(patHvOldTop, patHvNewTop);

const hvActionOld = `
                    {hv.status === "pending" && <div style={{display:"inline-flex", gap:6}}>
                      <button className="pp-btn" style={{background:"#e6f4ea",color:"#137333",padding:"6px 12px",fontSize:13}} onClick={()=>handleUpdate(hv._id||hv.id, "accepted")}>Accept</button>
                      <button className="pp-btn" style={{background:"#fce8e6",color:"#c5221f",padding:"6px 12px",fontSize:13}} onClick={()=>handleUpdate(hv._id||hv.id, "declined")}>Reject</button>
                    </div>}
`;

const hvActionNew = `
                    {hv.status?.toLowerCase() === "pending" && <div style={{display:"inline-flex", gap:6}}>
                      <button className="pp-btn" style={{background:"#e6f4ea",color:"#137333",padding:"6px 12px",fontSize:13}} onClick={()=>handleUpdate(hv, "accepted")}>Accept</button>
                      <button className="pp-btn" style={{background:"#fce8e6",color:"#c5221f",padding:"6px 12px",fontSize:13}} onClick={()=>handleUpdate(hv, "declined")}>Reject</button>
                    </div>}
`;
ppCode = ppCode.replace(hvActionOld, hvActionNew);


fs.writeFileSync(ppPath, ppCode);
console.log("Fixed patient panel bugs.");
