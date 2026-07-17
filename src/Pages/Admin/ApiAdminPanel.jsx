import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import AdminMemberships from "./AdminMemberships";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const COLORS = ["#1e88e5","#00bfa5","#7c3aed","#f44336","#ff7043","#0891b2","#16a34a","#be185d"];
function Avatar({ name = "?", size = 36, src }) {
  if (src) return <img src={src} alt={name} style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", flexShrink:0, border:"2px solid #e2e8f0" }}/>;
  const init  = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const color = COLORS[(name.charCodeAt(0) || 0) % COLORS.length];
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:color, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:size*.37, flexShrink:0, fontFamily:"'Sora',sans-serif" }}>
      {init}
    </div>
  );
}

const SC = { confirmed:"#22c55e", active:"#22c55e", paid:"#22c55e", completed:"#22c55e", accepted:"#22c55e", online:"#22c55e",
  pending:"#fbbf24", scheduled:"#fbbf24",
  cancelled:"#ef4444", declined:"#ef4444", inactive:"#94a3b8", suspended:"#ef4444" };
function Badge({ label, color }) {
  const c = color || SC[label?.toLowerCase()] || "#94a3b8";
  return <span style={{ background:c+"15", color:c, border:`1px solid ${c}30`, borderRadius:999, padding:"4px 12px", fontSize:11, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase", whiteSpace:"nowrap" }}>{label}</span>;
}

const NAV = [
  { section:"Administration" },
  { key:"overview",  icon:"layout-dashboard", label:"Dashboard" },
  { key:"doctors",   icon:"stethoscope", label:"Doctors" },
  { key:"patients",  icon:"users", label:"Patients" },
  { key:"appointments", icon:"calendar-event", label:"Appointments" },
  { key:"payments",  icon:"cash", label:"Payments" },
    { key:"memberships", icon:"chart-bar", label:"SaaS MRR" },
];

export default function ApiAdminPanel({ admin: sessionUser, onLogout }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [sideOpen, setSideOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    // Support both the Auth wrapper and direct /adminpanel navigation.
    localStorage.removeItem("token");
    localStorage.removeItem("stech_session");

    if (onLogout) {
      onLogout();
    } else {
      navigate("/login", { replace: true });
    }
  };

  const fetchOverview = async () => {
    try {
      const res = await API.get("/admin/overview");
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading || !data) return <div style={{ padding: "3rem", textAlign: "center" }}>Loading Admin Portal...</div>;

  const { stats, recentActivity } = data;

  return (
    <div className="dp-root">
      <style>{CSS}</style>

      <aside className={`dp-sidebar${sideOpen?" open":""}`}>
        <div className="dp-brand">
          <img src="/logo.png" alt="Zendenta Logo" style={{ filter: "brightness(0) invert(0)" }} onError={(e)=>{e.target.style.display='none';}} />
          <div className="dp-brand-text">TOOTHEASE</div>
        </div>
        
        <nav className="dp-nav">
          {NAV.map((n,i) => {
            if (n.section) return null; // Hide sections for a cleaner look
            return (
              <button key={n.key} className={`dp-nav-item${tab===n.key?" active":""}`} onClick={() => { setTab(n.key); setSideOpen(false); }}>
                <span className="dp-nav-icon"><i className={`ti ti-${n.icon}`}/></span>
                <span>{n.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="dp-user-block">
          <Avatar name={sessionUser?.name || "Admin"} size={44}/>
          <div style={{ overflow:"hidden" }}>
            <div style={{ color:"var(--text-dark)", fontWeight:800, fontSize:14, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{sessionUser?.name || ""}</div>
            <div style={{ color:"var(--text-gray)", fontSize:12, fontWeight:600 }}>Administrator</div>
          </div>
        </div>
      </aside>

      <div className="dp-main">
        <header className="dp-topbar">
          <button className="dp-hamburger" onClick={() => setSideOpen(s=>!s)} style={{display:'none'}}><i className="ti ti-menu-2"/></button>
          
          <div className="dp-topbar-title">
            Welcome Back, {sessionUser?.name?.split(" ")[0] || "ADMIN"}!
          </div>
          <div className="dp-top-right">
            <div className="dp-search">
              <i className="ti ti-search" style={{color:"#94a3b8", fontSize:18}}/>
              <input type="text" placeholder="Search..." />
            </div>
            <button className="dp-period-btn">Period: Monthly <i className="ti ti-chevron-down"/></button>
            <Avatar name={sessionUser?.name || "Admin"} size={40}/>
          </div>
        </header>

        <main className="dp-content">
          {tab==="overview" && <AdminOverview stats={stats} recent={recentActivity} admin={sessionUser} />}
          {tab==="doctors" && <AdminDoctors />}
          {tab==="patients" && <AdminPatients />}
          {tab==="appointments" && <AdminAppointments />}
          {tab==="payments" && <AdminPayments />}
          {tab==="memberships" && <AdminMemberships />}
        </main>
      </div>

      {sideOpen && <div className="dp-overlay" onClick={() => setSideOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:250}}/>}
    </div>
  );
}

function AdminOverview({ stats, recent, admin }) {
  // Recharts Colors
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const mAppts = stats?.monthlyAppointments || [];
  const pTreat = stats?.treatmentStats || [];
  const sRates = stats?.successRates || [];
  const tAppts = stats?.todaysAppointments || [];

  return (
    <div className="dp-anim">
      {/* TOP ROW: Stats & Main Chart */}
      <div className="oa-grid">
        {/* 4 Stat Cards */}
        <div style={{gridColumn:"span 5", display:"grid", gridTemplateColumns:"1fr 1fr", gap:24}}>
          <div className="oa-stat-card">
            <div className="oa-stat-top">
              <div className="oa-stat-icon" style={{background:"#eff6ff"}}><i className="ti ti-users"/></div>
              <div className="oa-trend up"><i className="ti ti-trending-up"/> +12%</div>
            </div>
            <div>
              <div className="oa-stat-num">{stats?.totalPatients || 0}</div>
              <div className="oa-stat-label">Total Patients</div>
            </div>
          </div>
          <div className="oa-stat-card">
            <div className="oa-stat-top">
              <div className="oa-stat-icon" style={{background:"#ecfdf5", color:"#10b981"}}><i className="ti ti-stethoscope"/></div>
              <div className="oa-trend up"><i className="ti ti-trending-up"/> +2</div>
            </div>
            <div>
              <div className="oa-stat-num">{stats?.activeDoctors || 0}</div>
              <div className="oa-stat-label">Active Doctors</div>
            </div>
          </div>
          <div className="oa-stat-card">
            <div className="oa-stat-top">
              <div className="oa-stat-icon" style={{background:"#fef2f2", color:"#ef4444"}}><i className="ti ti-calendar-clock"/></div>
              <div className="oa-trend down"><i className="ti ti-trending-down"/> -5%</div>
            </div>
            <div>
              <div className="oa-stat-num">{stats?.pendingAppointments || 0}</div>
              <div className="oa-stat-label">Pending Appointments</div>
            </div>
          </div>
          <div className="oa-stat-card">
            <div className="oa-stat-top">
              <div className="oa-stat-icon" style={{background:"#fffbeb", color:"#f59e0b"}}><i className="ti ti-currency-dollar"/></div>
              <div className="oa-trend up"><i className="ti ti-trending-up"/> +8%</div>
            </div>
            <div>
              <div className="oa-stat-num">{(stats?.totalRevenue||0).toLocaleString()}</div>
              <div className="oa-stat-label">Revenue (XAF)</div>
            </div>
          </div>
        </div>

        {/* Appointment Bar Chart */}
        <div className="oa-card" style={{gridColumn:"span 7", display:"flex", flexDirection:"column"}}>
          <div className="oa-card-title">
            <span>Appointment Activity</span>
            <button className="dp-btn-outline">Export</button>
          </div>
          <div style={{flex:1, minHeight:200}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mAppts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10}/>
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}}/>
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}/>
                <Legend iconType="circle" wrapperStyle={{fontSize:12, paddingTop:20}}/>
                <Bar dataKey="Booked" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="Canceled" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* MIDDLE ROW */}
      <div className="oa-grid">
        {/* Top Treatments Pie */}
        <div className="oa-card" style={{gridColumn:"span 4"}}>
          <div className="oa-card-title">Top Treatments</div>
          <div style={{height: 200}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pTreat} innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {pTreat.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}/>
                <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{fontSize:12}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* New Patient Details (Mock profile) */}
        {/* <div className="oa-card" style={{gridColumn:"span 4"}}>
          <div className="oa-card-title">New Patient Details</div>
          <div style={{display:'flex', gap:16, alignItems:'center', marginBottom:20}}>
            <Avatar name="Sophia Lauren" size={50} />
            <div>
              <div style={{fontSize:16, fontWeight:800, color:"var(--text-dark)"}}>Sophia Lauren</div>
              <div style={{fontSize:13, color:"var(--text-gray)", fontWeight:500}}>Registered Today</div>
            </div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, fontSize:13}}>
            <div><span style={{color:"var(--text-gray)"}}>Gender:</span> <br/><b>Female</b></div>
            <div><span style={{color:"var(--text-gray)"}}>Age:</span> <br/><b>24 yrs</b></div>
            <div><span style={{color:"var(--text-gray)"}}>Height:</span> <br/><b>165 cm</b></div>
            <div><span style={{color:"var(--text-gray)"}}>Weight:</span> <br/><b>55 kg</b></div>
          </div>
        </div> */}

        {/* Approval Requests */}
        <div className="oa-card" style={{gridColumn:"span 4", overflowY:"auto"}}>
          <div className="oa-card-title">Approval Requests</div>
          <div>
            {(!recent || recent.length===0) ? <div style={{padding:20, textAlign:'center', color:'#94a3b8'}}>No requests</div> : recent.slice(0,3).map(r => (
              <div key={r._id} className="oa-list-item">
                <div className="oa-list-user">
                  <Avatar name={r.patientId?.name} size={36}/>
                  <div>
                    <div className="oa-list-name">{r.patientId?.name}</div>
                    <div className="oa-list-sub">{r.healthType}</div>
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:12, fontWeight:700, color:"var(--text-dark)", marginBottom:4}}>{r.date?.split("T")[0]}</div>
                  <Badge label="PENDING" color="#f59e0b" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="oa-grid">
        {/* Today's Appointments */}
        <div className="oa-card" style={{gridColumn:"span 4", maxHeight: 300, overflowY:"auto"}}>
          <div className="oa-card-title">Today's Appointment <span style={{background:"#eff6ff", color:"#3b82f6", padding:"2px 8px", borderRadius:99, fontSize:12}}>{tAppts.length}</span></div>
          <div>
            {tAppts.length===0 ? <div style={{padding:20, textAlign:'center', color:'#94a3b8'}}>No appointments today</div> : tAppts.map(a => (
              <div key={a._id} className="oa-list-item">
                <div>
                  <div className="oa-list-name">{a.healthType}</div>
                  <div className="oa-list-sub">{a.patientId?.name}</div>
                </div>
                <div style={{fontSize:12, fontWeight:700, color:"var(--text-dark)", background:"#f1f5f9", padding:"4px 10px", borderRadius:6}}>{a.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Success Rate Line Chart */}
        <div className="oa-card" style={{gridColumn:"span 4", display:"flex", flexDirection:"column"}}>
          <div className="oa-card-title">Success Rate</div>
          <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:16}}>
            <div style={{fontSize:32, fontWeight:800}}>90%</div>
            <div className="oa-trend up"><i className="ti ti-trending-up"/> +2%</div>
          </div>
          <div style={{flex:1, minHeight:120}}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sRates}>
                <Tooltip contentStyle={{borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}/>
                <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 0}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Totals & Revenue */}
        <div className="oa-card" style={{gridColumn:"span 4", display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
          <div style={{display:'flex', flexDirection:'column', justifyContent:'center'}}>
            <div style={{fontSize:13, fontWeight:600, color:"var(--text-gray)"}}>Total Patients This Month</div>
            <div style={{fontSize:36, fontWeight:800, color:"var(--text-dark)", margin:"8px 0"}}>{Math.floor((stats?.totalPatients||0) / 4) + 12}</div>
            <button className="dp-btn-outline" style={{width:"max-content"}}>View More</button>
          </div>
          <div style={{display:'flex', flexDirection:'column', justifyContent:'center', borderLeft:"1px solid var(--border)", paddingLeft:16}}>
            <div style={{fontSize:13, fontWeight:600, color:"var(--text-gray)"}}>Revenue (Month)</div>
            <div style={{fontSize:28, fontWeight:800, color:"var(--text-dark)", margin:"8px 0"}}>{Math.floor((stats?.totalRevenue||0) / 3).toLocaleString()}</div>
            <button className="dp-btn-outline" style={{width:"max-content"}}>View More</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);

  const fetchDocs = async () => {
    try {
      const res = await API.get("/admin/doctors");
      if (res.data.success) setDoctors(res.data.doctors);
    } catch(err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDocs(); }, []);

  const changeStatus = async (id, status) => {
    try {
      await API.patch(`/admin/doctors/${id}/status`, { status });
      fetchDocs();
    } catch(err) { console.error(err); }
  };
  const createDoctor = async (event) => {
    event.preventDefault();
    try { await API.post("/admin/doctors", form); setForm(null); fetchDocs(); }
    catch (err) { alert(err.response?.data?.message || "Unable to create doctor"); }
  };

  if (loading) return <div>Loading doctors...</div>;

  return (
    <div className="dp-anim">
      <div className="dp-page-head">
        <div><h1 className="dp-title">Manage Doctors</h1></div>
        <button className="dp-btn-primary" onClick={()=>setForm({ name:"", email:"", password:"", specialty:"", phone:"", consultFee:15000 })}>Add Doctor</button>
      </div>
      {form && <form className="dp-card" onSubmit={createDoctor} style={{marginBottom:16,display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:10}}>
        {[["name","Name"],["email","Email"],["password","Password"],["specialty","Specialty"],["phone","Phone"],["consultFee","Consult fee"]].map(([key,label])=><input key={key} required={["name","email","password","specialty"].includes(key)} type={key==="password"?"password":key==="consultFee"?"number":"text"} placeholder={label} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}/>)}
        <button className="dp-btn-primary" type="submit">Create</button><button className="dp-ghost" type="button" onClick={()=>setForm(null)}>Cancel</button>
      </form>}
      <div className="dp-card">
        <div className="dp-tbl-wrap">
          <table className="dp-table">
            <thead>
              <tr><th>Doctor</th><th>Specialty</th><th>Phone</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {doctors.map(d => (
                <tr key={d._id}>
                  <td>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <Avatar name={d.userId?.name} size={30}/>
                      <strong>{d.userId?.name}</strong>
                    </div>
                  </td>
                  <td>{d.specialty}</td>
                  <td>{d.userId?.phone || "-"}</td>
                  <td><Badge label={d.status}/></td>
                  <td>
                    {d.status !== "ACTIVE" && <button onClick={()=>changeStatus(d._id,"ACTIVE")} style={{ background:"#10b981", color:"#fff", border:"none", borderRadius:6, padding:"4px 10px", cursor:"pointer", fontSize:11, fontWeight:700, marginRight:6 }}>Approve</button>}
                    {d.status === "ACTIVE" && <button onClick={()=>changeStatus(d._id,"SUSPENDED")} style={{ background:"#ef4444", color:"#fff", border:"none", borderRadius:6, padding:"4px 10px", cursor:"pointer", fontSize:11, fontWeight:700 }}>Suspend</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/admin/users").then(res => {
      if (res.data.success) setPatients(res.data.users.filter(u=>u.role==="PATIENT"));
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading patients...</div>;
  const toggleStatus = async (patient) => { await API.patch(`/admin/users/${patient._id}/status`, { status:patient.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }); setPatients(ps=>ps.map(p=>p._id===patient._id?{...p,status:patient.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"}:p)); };

  return (
    <div className="dp-anim">
      <div className="dp-page-head"><div><h1 className="dp-title">Registered Patients</h1></div></div>
      <div className="dp-card">
        <div className="dp-tbl-wrap">
          <table className="dp-table">
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th><th>Action</th></tr></thead>
            <tbody>
              {patients.map(p => (
                <tr key={p._id}>
                  <td><div style={{ display:"flex", alignItems:"center", gap:8 }}><Avatar name={p.name} size={30}/><strong>{p.name}</strong></div></td>
                  <td>{p.email}</td>
                  <td>{p.phone || "-"}</td>
                  <td>{p.createdAt?.split("T")[0]}</td>
                  <td><button className="dp-ghost" onClick={()=>toggleStatus(p)}>{p.status === "ACTIVE" ? "Deactivate" : "Activate"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  useEffect(()=>{ API.get("/admin/appointments").then(r=>setAppointments(r.data.appointments || [])).catch(console.error); },[]);
  const setStatus = async (id, status) => { await API.patch(`/admin/appointments/${id}/status`, { status }); setAppointments(items=>items.map(a=>a._id===id?{...a,status}:a)); };
  return <div className="dp-anim"><div className="dp-page-head"><h1 className="dp-title">Appointments</h1></div><div className="dp-card"><div className="dp-tbl-wrap"><table className="dp-table"><thead><tr><th>Patient</th><th>Doctor</th><th>Service</th><th>Date</th><th>Status</th><th>Action</th></tr></thead><tbody>{appointments.map(a=><tr key={a._id}><td>{a.patientId?.name}</td><td>Dr. {a.doctorId?.userId?.name}</td><td>{a.healthType}</td><td>{a.date?.split("T")[0]} {a.time}</td><td><Badge label={a.status}/></td><td><select value={a.status} onChange={e=>setStatus(a._id,e.target.value)}><option>PENDING</option><option>CONFIRMED</option><option>COMPLETED</option><option>CANCELLED</option></select></td></tr>)}</tbody></table></div></div></div>;
}

function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/admin/payments").then(res => {
      if (res.data.success) setPayments(res.data.payments);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading payments...</div>;
  const complete = async (id) => { await API.patch(`/admin/payments/${id}/complete`); setPayments(items=>items.map(p=>p._id===id?{...p,status:"COMPLETED"}:p)); };

  return (
    <div className="dp-anim">
      <div className="dp-page-head"><div><h1 className="dp-title">Payment History</h1></div></div>
      <div className="dp-card">
        <div className="dp-tbl-wrap">
          <table className="dp-table">
            <thead><tr><th>Patient</th><th>Doctor</th><th>Service</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {payments.map(p => (
                <tr key={p._id}>
                  <td>{p.patientId?.name}</td>
                  <td>Dr. {p.doctorId?.userId?.name}</td>
                  <td>{p.service}</td>
                  <td><strong style={{color:"#00bfa5"}}>{(p.amount||0).toLocaleString("fr-CM")} XAF</strong></td>
                  <td><Badge label={p.status}/></td>
                  <td>{p.status === "PENDING" && <button className="dp-ghost" onClick={()=>complete(p._id)}>Mark paid</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
:root{--sw:240px;--bg:#f8fafc;--blue:#2563eb;--text-dark:#0f172a;--text-gray:#64748b;--border:#e2e8f0;--card:#ffffff;--chart-1:#3b82f6;--chart-2:#10b981;--chart-3:#f59e0b;--chart-4:#ef4444;}
*{box-sizing:border-box;margin:0;padding:0;font-family:'Plus Jakarta Sans',sans-serif;}

/* App Wrapper */
.dp-root{display:flex;height:100vh;overflow:hidden;background:var(--bg);color:var(--text-dark);}

/* Sidebar */
.dp-sidebar{width:var(--sw);background:var(--card);display:flex;flex-direction:column;height:100vh;flex-shrink:0;overflow-y:auto;transition:transform .28s;position:relative;z-index:200;border-right:1px solid var(--border);}
.dp-brand{display:flex;align-items:center;gap:12px;padding:24px;flex-shrink:0}
.dp-brand img{width:32px;height:32px;object-fit:contain}
.dp-brand-text{font-size:20px;font-weight:800;color:var(--text-dark);letter-spacing:-0.5px}

.dp-nav{flex:1;padding:12px 16px;overflow-y:auto;display:flex;flex-direction:column;gap:4px}
.dp-nav-item{display:flex;align-items:center;gap:14px;width:100%;padding:10px 16px;background:none;border:none;cursor:pointer;color:var(--text-gray);font-size:14px;font-weight:600;text-align:left;position:relative;transition:all 0.2s;border-radius:12px;}
.dp-nav-item:hover{background:#f1f5f9;color:var(--text-dark)}
.dp-nav-item.active{background:var(--blue);color:#fff;}
.dp-nav-item.active:hover{color:#fff}
.dp-nav-icon{font-size:18px;width:24px;text-align:center;display:flex;align-items:center;justify-content:center}

.dp-logout{margin:16px;padding:12px 16px;background:#fef2f2;border-radius:12px;border:none;cursor:pointer;color:#ef4444;font-size:14px;font-weight:700;text-align:center;transition:all .2s;}
.dp-logout:hover{background:#fee2e2}

/* Main Area */
.dp-main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
.dp-topbar{height:80px;background:var(--bg);display:flex;align-items:center;padding:0 32px;flex-shrink:0;z-index:100;justify-content:space-between}
.dp-topbar-title{font-size:24px;font-weight:800;color:var(--text-dark);letter-spacing:-0.5px}
.dp-top-right{display:flex;align-items:center;gap:16px}
.dp-search{background:#fff;border-radius:12px;padding:10px 16px;display:flex;align-items:center;gap:10px;width:260px;border:1px solid var(--border);box-shadow:0 1px 2px rgba(0,0,0,0.02)}
.dp-search input{border:none;background:none;outline:none;font-size:13px;width:100%;font-weight:500}
.dp-period-btn{background:#fff;border:1px solid var(--border);border-radius:12px;padding:10px 16px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,0.02)}

.dp-content{flex:1;overflow-y:auto;padding:0 32px 32px;}
.dp-anim{animation:dpFadeUp .4s cubic-bezier(0.16, 1, 0.3, 1)}
@keyframes dpFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}

/* Oral Admin Grid */
.oa-grid{display:grid;grid-template-columns:repeat(12, 1fr);gap:24px;margin-bottom:24px}
.oa-card{background:var(--card);border-radius:20px;padding:24px;border:1px solid var(--border);box-shadow:0 1px 3px rgba(0,0,0,0.02)}
.oa-card-title{font-size:15px;font-weight:700;color:var(--text-dark);margin-bottom:20px;display:flex;align-items:center;justify-content:space-between}

/* Mini Stat Cards */
.oa-stat-card{background:var(--card);border-radius:16px;padding:20px;border:1px solid var(--border);box-shadow:0 1px 3px rgba(0,0,0,0.02);display:flex;flex-direction:column;justify-content:space-between}
.oa-stat-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px}
.oa-stat-icon{width:40px;height:40px;border-radius:12px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--blue)}
.oa-stat-num{font-size:28px;font-weight:800;color:var(--text-dark);line-height:1;margin-bottom:8px}
.oa-stat-label{font-size:13px;font-weight:600;color:var(--text-gray)}
.oa-trend{display:flex;align-items:center;gap:4px;font-size:12px;font-weight:700}
.oa-trend.up{color:#10b981}
.oa-trend.down{color:#ef4444}

/* Approvals / Users List */
.oa-list-item{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f1f5f9}
.oa-list-item:last-child{border-bottom:none;padding-bottom:0}
.oa-list-user{display:flex;align-items:center;gap:12px}
.oa-list-name{font-size:14px;font-weight:700;color:var(--text-dark)}
.oa-list-sub{font-size:12px;font-weight:500;color:var(--text-gray)}

.dp-btn-outline{border:1px solid var(--border);background:transparent;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;color:var(--text-dark)}
.dp-btn-outline:hover{background:#f1f5f9}

@media(max-width:1280px){
  .oa-grid{grid-template-columns:1fr}
}
`;
