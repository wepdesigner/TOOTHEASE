const fs = require('fs');
const path = require('path');

const dpPath = path.join(__dirname, '../src/Pages/Doctor/ApiDoctorPanel.jsx');
let dpCode = fs.readFileSync(dpPath, 'utf8');

// 1. Import DentalChart
if (!dpCode.includes('DentalChart')) {
  dpCode = dpCode.replace(
    'import { useNavigate } from "react-router-dom";',
    'import { useNavigate } from "react-router-dom";\nimport DentalChart from "../../components/DentalChart";'
  );
}

// 2. Rewrite DocPatients
const docPatOldStart = 'function DocPatients(){const[pts,setPts]=useState([]);const[l,setL]=useState(true);useEffect(()=>{API.get("/doctor/patients").then(r=>{if(r.data.success)setPts(r.data.patients);setL(false);}).catch(()=>setL(false));},[]);if(l)return<div className="dp-anim"><div className="dp-empty"><p>Loading...</p></div></div>;return<div className="dp-anim"><div className="dp-page-head"><div><h1 className="dp-title">My Patients</h1><p className="dp-sub">{pts.length} patients</p></div></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:16}}>{pts.length===0&&<div className="dp-card"><div className="dp-empty"><p>None.</p></div></div>}{pts.map(p=><div key={p.id||p._id} className="dp-card"><Avatar name={p.name} size={44} src={p.avatar}/><div style={{fontWeight:700,fontSize:15}}>{p.name}</div><div style={{fontSize:12,color:"#64748b"}}>{p.email}</div><div style={{fontSize:13,color:"#64748b"}}>Blood: {p.bloodType||"\\u2014"}</div><div style={{fontSize:13,color:"#64748b"}}>Allergies: {p.allergies||"None"}</div></div>)}</div></div>;}';

const docPatNew = `
function DocPatients({ toast }) {
  const [pts, setPts] = useState([]);
  const [l, setL] = useState(true);
  const [chartPatient, setChartPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [toothModal, setToothModal] = useState(null); // { toothId, status }
  const [fm, setFm] = useState({ condition: 'Healthy', notes: '' });

  useEffect(() => {
    API.get("/doctor/patients").then(r => {
      if (r.data.success) setPts(r.data.patients);
      setL(false);
    }).catch(() => setL(false));
  }, []);

  const loadRecords = async (pId) => {
    try {
      const r = await API.get(\`/doctor/patients/\${pId}/dental-records\`);
      if (r.data.success) setRecords(r.data.dentalRecords);
    } catch(e) {}
  };

  const handleOpenChart = (p) => {
    setChartPatient(p);
    loadRecords(p.id || p._id);
  };

  const handleToothClick = (toothId, status) => {
    setFm({ condition: status?.condition || 'Healthy', notes: status?.notes || '' });
    setToothModal({ toothId });
  };

  const handleSaveTooth = async () => {
    try {
      await API.post('/doctor/dental-records', {
        patientId: chartPatient.id || chartPatient._id,
        toothId: toothModal.toothId,
        condition: fm.condition,
        notes: fm.notes
      });
      toast("Record saved successfully!");
      setToothModal(null);
      loadRecords(chartPatient.id || chartPatient._id);
    } catch(e) {
      toast("Failed to save record", "error");
    }
  };

  if (l) return <div className="dp-anim"><div className="dp-empty"><p>Loading...</p></div></div>;

  if (chartPatient) {
    return (
      <div className="dp-anim" style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div className="dp-page-head">
          <div>
            <h1 className="dp-title">{chartPatient.name}'s 3D Chart</h1>
            <p className="dp-sub">Click any tooth to update status</p>
          </div>
          <button className="dp-ghost" onClick={() => setChartPatient(null)}>? Back</button>
        </div>
        <DentalChart records={records} readOnly={false} onToothClick={handleToothClick} />

        {toothModal && (
          <Modal title={\`Update Tooth \${toothModal.toothId}\`} onClose={() => setToothModal(null)}>
            <FRow label="Condition">
              <select style={inp} value={fm.condition} onChange={e => setFm({...fm, condition: e.target.value})}>
                {["Healthy", "Cavity", "Crown", "Extracted", "Implant", "Filling", "Root Canal", "Veneer", "Bridge", "Watch"].map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </FRow>
            <FRow label="Notes">
              <textarea style={{...inp, height: 80, resize: "vertical"}} value={fm.notes} onChange={e => setFm({...fm, notes: e.target.value})} placeholder="Optional notes about this tooth" />
            </FRow>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button className="dp-ghost" onClick={() => setToothModal(null)}>Cancel</button>
              <button className="dp-btn-primary" onClick={handleSaveTooth}>Save</button>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div className="dp-anim">
      <div className="dp-page-head">
        <div>
          <h1 className="dp-title">My Patients</h1>
          <p className="dp-sub">{pts.length} patients</p>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:16}}>
        {pts.length===0 && <div className="dp-card"><div className="dp-empty"><p>None.</p></div></div>}
        {pts.map(p => (
          <div key={p.id||p._id} className="dp-card">
            <Avatar name={p.name} size={44} src={p.avatar}/>
            <div style={{fontWeight:700,fontSize:15}}>{p.name}</div>
            <div style={{fontSize:12,color:"#64748b"}}>{p.email}</div>
            <div style={{fontSize:13,color:"#64748b",marginTop:4}}>Blood: {p.bloodType||"\\u2014"}</div>
            <div style={{fontSize:13,color:"#64748b"}}>Allergies: {p.allergies||"None"}</div>
            <button className="dp-btn-primary" style={{width: '100%', marginTop: 12}} onClick={() => handleOpenChart(p)}>View 3D Chart</button>
          </div>
        ))}
      </div>
    </div>
  );
}
`;

dpCode = dpCode.replace(docPatOldStart, docPatNew);

fs.writeFileSync(dpPath, dpCode);
console.log("Doctor Panel updated with Dental Chart editing capabilities.");
