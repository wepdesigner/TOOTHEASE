import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import "./Styles/Admin.css";
import AdminMemberships from "./AdminMemberships";

const uid = () => Math.random().toString(36).slice(2, 10).toUpperCase();
const now = () => new Date().toISOString();
const COMMISSION_PCT = 12;

function Av({ name="?", size=36 }) {
  const colors = ["#1e88e5","#00bfa5","#7c3aed","#f44336","#ff7043","#0d47a1","#00838f"];
  const idx = (name.charCodeAt(0)||0) % colors.length;
  const initials = name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:colors[idx], color:"#fff",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontWeight:700, fontSize:size*0.36, flexShrink:0, fontFamily:"'Sora',sans-serif",
      boxShadow:"0 2px 8px rgba(0,0,0,.18)" }}>
      {initials}
    </div>
  );
}

function Badge({ label }) {
  let bg = "#f1f5f9", c = "#475569";
  const s = String(label).toLowerCase();
  if(s==="active" || s==="confirmed" || s==="paid" || s==="completed") { bg="#dcfce7"; c="#16a34a"; }
  if(s==="pending") { bg="#fef3c7"; c="#d97706"; }
  if(s==="suspended" || s==="cancelled" || s==="failed") { bg="#fee2e2"; c="#dc2626"; }
  return <span style={{ background:bg, color:c, padding:"4px 10px", borderRadius:12, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{label}</span>;
}

function Modal({ title, onClose, children, width=400 }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-content page-anim" style={{width, maxWidth:"90vw"}}>
        <div className="modal-head">
          <h3 style={{margin:0,fontSize:18}}>{title}</h3>
          <button className="ghost-btn" style={{padding:"6px 12px"}} onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function FRow({ label, children }) {
  return (
    <div style={{marginBottom:14}}>
      <label style={{display:"block",marginBottom:6,fontSize:12,fontWeight:600,color:"var(--muted)"}}>{label}</label>
      {children}
    </div>
  );
}
const inp = { width:"100%", padding:"10px 14px", border:"1px solid var(--border)", borderRadius:8, fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box" };

function useToast() {
  const [list, setList] = useState([]);
  const fire = (msg, type="success") => {
    const id = uid();
    setList(l => [...l, { id, msg, type }]);
    setTimeout(() => setList(l => l.filter(x => x.id !== id)), 4000);
  };
  return { list, fire };
}

// ----------------------------------------------------------------------
// COMPONENTS
// ----------------------------------------------------------------------

function AdminOverview({ onNav, toast }) {
  const [stats, setStats] = useState({ totalPatients:0, totalDoctors:0, activeDoctors:0, pendingAppointments:0, totalAppointments:0, totalRevenue:0 });
  const [recent, setRecent] = useState([]);
  
  useEffect(() => {
    API.get('/admin/overview').then(res => {
      if(res.data.success) {
        setStats(res.data.stats);
        setRecent(res.data.recentActivity || []);
      }
    }).catch(console.error);
  }, []);

  const statCards = [
    { icon:"👤", label:"Patients",       value:stats.totalPatients,      color:"#1e88e5", trend:"Total users" },
    { icon:"👨‍⚕️", label:"Doctors",         value:stats.totalDoctors,       color:"#00bfa5", trend:`${stats.activeDoctors} active` },
    { icon:"📅", label:"Appointments",    value:stats.totalAppointments,  color:"#f44336", trend:`${stats.pendingAppointments} pending` },
    { icon:"💰", label:"Total Revenue",   value:`${(stats.totalRevenue/1000).toFixed(1)}K XAF`, color:"#7c3aed", trend:"Admin cut" },
  ];

  return (
    <div className="page-anim">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Welcome back, Administrator • {new Date().toDateString()}</p>
        </div>
        <button className="btn-primary" onClick={() => onNav("appointments")}>+ Appointment</button>
      </div>

      <div className="stats-row">
        {statCards.map(s => (
          <div key={s.label} className="stat-card" style={{ "--accent":s.color }}>
            <div className="stat-icon-wrap" style={{ background:s.color+"1a" }}>{s.icon}</div>
            <div className="stat-body">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-trend">{s.trend}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Recent Appointments</div>
            <button className="ghost-btn" onClick={()=>onNav("appointments")}>View all ➔</button>
          </div>
          <div className="tbl-wrap">
            <table className="s-table">
              <thead><tr><th>Patient</th><th>Doctor</th><th>Type</th><th>Status</th></tr></thead>
              <tbody>
                {recent.map(a=>(
                  <tr key={a._id}>
                    <td><div style={{display:"flex",alignItems:"center",gap:8}}><Av name={a.patientId?.name||"?"} size={26}/>{a.patientId?.name}</div></td>
                    <td className="hide-sm">Dr. {a.doctorId?.userId?.name||"?"}</td>
                    <td>{a.healthType}</td>
                    <td><Badge label={a.status}/></td>
                  </tr>
                ))}
                {recent.length === 0 && <tr><td colSpan={4}>No recent appointments</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <div className="card-title" style={{marginBottom:14}}>Quick Actions</div>
            <div className="quick-grid">
              {[
                {icon:"⚕️",label:"Add Doctor",    nav:"doctors",       c:"#00bfa5"},
                {icon:"👥",label:"Patients",       nav:"patients",      c:"#1e88e5"},
                {icon:"💳",label:"Payments",       nav:"payments",      c:"#f44336"},
                {icon:"⚙️",label:"Settings",       nav:"settings",      c:"#fbbf24"},
              ].map(q=>(
                <button key={q.label} className="quick-btn" style={{"--qc":q.c}} onClick={()=>onNav(q.nav)}>
                  <span style={{fontSize:22}}>{q.icon}</span>
                  <span style={{fontSize:11,fontWeight:700}}>{q.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminDoctors({ toast }) {
  const [doctors, setDoctors] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name:"", email:"", phone:"", specialty:"", experience:"", location:"", password:"", consultFee:15000 });

  const fetchDoctors = () => {
    API.get('/admin/doctors').then(res => {
      if(res.data.success) setDoctors(res.data.doctors);
    }).catch(console.error);
  };
  useEffect(() => { fetchDoctors(); }, []);

  const save = async () => {
    if(!form.name || !form.email || !form.password) return toast("Name, email and password required","error");
    try {
      const res = await API.post('/admin/doctors', form);
      if(res.data.success) {
        toast("Doctor created successfully");
        setModal(false);
        fetchDoctors();
      } else toast(res.data.message, "error");
    } catch(err) { toast("Error creating doctor", "error"); }
  };

  const toggleStatus = async (d) => {
    const newStatus = d.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await API.patch(`/admin/doctors/${d._id}/status`, { status: newStatus });
      toast(`Doctor ${newStatus.toLowerCase()}`);
      fetchDoctors();
    } catch(err) { toast("Error updating status", "error"); }
  };

  return (
    <div className="page-anim">
      <div className="page-header">
        <div><h1 className="page-title">Doctors</h1><p className="page-sub">Manage clinic specialists</p></div>
        <button className="btn-primary" onClick={()=>{setForm({name:"",email:"",phone:"",specialty:"",experience:"",location:"",password:"",consultFee:15000});setModal(true)}}>+ Add Doctor</button>
      </div>
      <div className="card">
        <div className="tbl-wrap">
          <table className="s-table">
            <thead><tr><th>Doctor</th><th>Specialty</th><th>Location</th><th>Fee (XAF)</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {doctors.map(d=>(
                <tr key={d._id}>
                  <td>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <Av name={d.userId?.name} size={32}/>
                      <div><div style={{fontWeight:600}}>{d.userId?.name}</div><div style={{fontSize:11,color:"var(--muted)"}}>{d.userId?.email}</div></div>
                    </div>
                  </td>
                  <td>{d.specialty}</td>
                  <td>{d.location}</td>
                  <td>{d.consultFee}</td>
                  <td><Badge label={d.status}/></td>
                  <td>
                    <div style={{display:"flex",gap:8}}>
                      <button className="ghost-btn" style={{color:d.status==="ACTIVE"?"var(--red)":"var(--green)"}} onClick={()=>toggleStatus(d)}>
                        {d.status==="ACTIVE"?"Suspend":"Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal && (
        <Modal title="Add New Doctor" onClose={()=>setModal(false)} width={460}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <FRow label="Full Name*"><input style={inp} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Dr. John Doe"/></FRow>
            <FRow label="Email*"><input style={inp} type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></FRow>
            <FRow label="Phone"><input style={inp} value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/></FRow>
            <FRow label="Temporary Password*"><input style={inp} value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}/></FRow>
            <FRow label="Specialty"><input style={inp} value={form.specialty} onChange={e=>setForm(f=>({...f,specialty:e.target.value}))}/></FRow>
            <FRow label="Experience (yrs)"><input style={inp} value={form.experience} onChange={e=>setForm(f=>({...f,experience:e.target.value}))}/></FRow>
            <FRow label="Consultation Fee (XAF)"><input style={inp} type="number" value={form.consultFee} onChange={e=>setForm(f=>({...f,consultFee:e.target.value}))}/></FRow>
            <FRow label="Location"><input style={inp} value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))}/></FRow>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16}}>
            <button className="ghost-btn" onClick={()=>setModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={save}>Create Doctor</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function AdminPatients({ toast }) {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    API.get('/admin/users').then(res => {
      if(res.data.success) setPatients(res.data.users.filter(u=>u.role==="PATIENT"));
    }).catch(console.error);
  }, []);

  return (
    <div className="page-anim">
      <div className="page-header">
        <div><h1 className="page-title">Patients</h1><p className="page-sub">Registered patients database</p></div>
      </div>
      <div className="card">
        <div className="tbl-wrap">
          <table className="s-table">
            <thead><tr><th>Patient</th><th>Phone</th><th>Joined</th><th>Status</th></tr></thead>
            <tbody>
              {patients.map(p=>(
                <tr key={p._id}>
                  <td>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <Av name={p.name} size={32}/>
                      <div><div style={{fontWeight:600}}>{p.name}</div><div style={{fontSize:11,color:"var(--muted)"}}>{p.email}</div></div>
                    </div>
                  </td>
                  <td>{p.phone || "-"}</td>
                  <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td><Badge label={p.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminAppointments({ toast }) {
  const [appts, setAppts] = useState([]);

  const fetchAppts = () => {
    API.get('/admin/appointments').then(res => {
      if(res.data.success) setAppts(res.data.appointments);
    }).catch(console.error);
  };
  useEffect(() => { fetchAppts(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await API.patch(`/admin/appointments/${id}/status`, { status });
      toast(`Appointment ${status.toLowerCase()}`);
      fetchAppts();
    } catch(err) { toast("Error updating status", "error"); }
  };

  return (
    <div className="page-anim">
      <div className="page-header">
        <div><h1 className="page-title">Appointments</h1><p className="page-sub">All platform bookings</p></div>
      </div>
      <div className="card">
        <div className="tbl-wrap">
          <table className="s-table">
            <thead><tr><th>Patient</th><th>Doctor</th><th>Type</th><th>Date & Time</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {appts.map(a=>(
                <tr key={a._id}>
                  <td>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <Av name={a.patientId?.name||"?"} size={28}/>
                      <div><div style={{fontWeight:600}}>{a.patientId?.name}</div><div style={{fontSize:11,color:"var(--muted)"}}>{a.patientId?.phone}</div></div>
                    </div>
                  </td>
                  <td>Dr. {a.doctorId?.userId?.name||"?"}</td>
                  <td>{a.healthType}</td>
                  <td>{new Date(a.date).toLocaleDateString()} at {a.time}</td>
                  <td><Badge label={a.status}/></td>
                  <td>
                    {a.status === "PENDING" && (
                      <div style={{display:"flex",gap:8}}>
                        <button className="ghost-btn" style={{color:"var(--green)"}} onClick={()=>updateStatus(a._id, "CONFIRMED")}>Confirm</button>
                        <button className="ghost-btn" style={{color:"var(--red)"}} onClick={()=>updateStatus(a._id, "CANCELLED")}>Cancel</button>
                      </div>
                    )}
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

function AdminPayments({ toast }) {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    API.get('/admin/payments').then(res => {
      if(res.data.success) setPayments(res.data.payments);
    }).catch(console.error);
  }, []);

  return (
    <div className="page-anim">
      <div className="page-header">
        <div><h1 className="page-title">Payments</h1><p className="page-sub">Transaction history & admin fees</p></div>
      </div>
      <div className="card">
        <div className="tbl-wrap">
          <table className="s-table">
            <thead><tr><th>Patient</th><th>Doctor</th><th>Service</th><th>Amount (XAF)</th><th>Admin Cut</th><th>Status</th></tr></thead>
            <tbody>
              {payments.map(p=>(
                <tr key={p._id}>
                  <td style={{fontWeight:600}}>{p.patientId?.name || "?"}</td>
                  <td>Dr. {p.doctorId?.userId?.name || "?"}</td>
                  <td>{p.service}</td>
                  <td style={{fontWeight:700}}>{p.amount}</td>
                  <td style={{color:"var(--green)",fontWeight:700}}>{p.adminFee || 0}</td>
                  <td><Badge label={p.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminSettings({ toast }) {
  const save = () => toast("Settings saved!");
  return (
    <div className="page-anim">
      <div className="page-header"><div><h1 className="page-title">Settings</h1><p className="page-sub">System configuration</p></div></div>
      <div className="card" style={{maxWidth:560}}>
        <div className="card-title" style={{marginBottom:18}}>Clinic Settings</div>
        <FRow label="Clinic Name"><input style={inp} defaultValue="TOOTHEASE"/></FRow>
        <FRow label="Admin Commission % (default)"><input style={inp} type="number" defaultValue={12}/></FRow>
        <button className="btn-primary" style={{marginTop:8}} onClick={save}>Save Settings</button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// MAIN WRAPPER
// ----------------------------------------------------------------------

export default function AdminPanel({ onLogout }) {
  const navigate = useNavigate();
  const [view, setView] = useState("overview");
  const { list: toasts, fire: toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    
    // Check if user is admin
    API.get("/auth/me").then(res => {
      if(res.data.success && res.data.user.role !== "ADMIN") {
        navigate("/");
      }
    }).catch(() => { navigate("/login"); });
  }, [navigate]);

  const NAV = [
    { id:"overview",     icon:"📊", label:"Overview" },
    { sep:true, label:"MANAGEMENT" },
    { id:"doctors",      icon:"⚕️", label:"Doctors" },
    { id:"patients",     icon:"👥", label:"Patients" },
    { id:"appointments", icon:"📅", label:"Appointments" },
    { sep:true, label:"FINANCE & COMMS" },
    { id:"payments",     icon:"💳", label:"Payments" },
    { id:"memberships",  icon:"📈", label:"SaaS MRR" },
    { sep:true, label:"SYSTEM" },
    { id:"settings",     icon:"⚙️", label:"Settings" },
  ];

  return (
    <div className="adm-root">
      <aside className="adm-side hide-print">
        <div className="adm-logo" style={{display:"flex", justifyContent:"center", padding:"20px 0"}}>
          <img src="/logo.png" alt="TOOTHEASE Admin" style={{height: "50px", objectFit: "contain", filter: "brightness(0) invert(1)"}} />
        </div>
        <nav className="adm-nav">
          {NAV.map((n, i) => n.sep ? (
            <div key={"s"+i} className="adm-nav-sep">{n.label}</div>
          ) : (
            <div key={n.id} className={`adm-nav-item ${view===n.id?"active":""}`} onClick={()=>setView(n.id)}>
              <span className="adm-nav-icon">{n.icon}</span>
              {n.label}
            </div>
          ))}
        </nav>
        <div className="adm-side-foot">
          <div className="adm-profile">
            <Av name="Admin" size={32}/>
            <div className="adm-profile-info">
              <div style={{fontWeight:700,fontSize:13}}>Admin</div>
              <div style={{fontSize:11,color:"var(--muted)"}}>System Root</div>
            </div>
          </div>
          <button className="adm-logout" onClick={() => { localStorage.clear(); navigate("/login"); if(onLogout) onLogout(); }}>🚪 Logout</button>
        </div>
      </aside>

      <main className="adm-main">
        {view === "overview"     && <AdminOverview onNav={setView} toast={toast} />}
        {view === "doctors"      && <AdminDoctors toast={toast} />}
        {view === "patients"     && <AdminPatients toast={toast} />}
        {view === "appointments" && <AdminAppointments toast={toast} />}
        {view === "payments"     && <AdminPayments toast={toast} />}
        {view === "memberships"  && <AdminMemberships toast={toast} />}
        {view === "settings"     && <AdminSettings toast={toast} />}
      </main>

      <div className="toast-wrap hide-print">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </div>
  );
}
