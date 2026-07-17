
/**
 * Pages/Doctor/DoctorPanel.jsx
 * ===============================================================
 * Doctor portal built to match the PatientPanel.jsx the user
 * already has. Imports from the SAME Storage.js, uses the SAME
 * VideoCall.jsx and LiveMap.jsx, so every doctor action shows up
 * correctly on the patient side and is mirrored to admin.
 *
 * Key data-shape contracts (must match what PatientPanel reads):
 *  - apptDB items the doctor creates get createdByDoctor:true and
 *    status:"pending" so PatSchedules surfaces them with Accept/Reject.
 *  - consultDB items the doctor creates get doctorInitiated:true and
 *    status:"scheduled" so the incoming-call modal on PatientPanel
 *    fires (it polls for c.doctorInitiated && !c.patientAlerted).
 *  - homeVisitDB items the doctor creates get status:"scheduled" so
 *    they appear in PatSchedules pending list (patient can accept).
 *  - prescrDB / recordDB entries are pushed with pushNotif directly
 *    to the patient AND mirrored to admin via Storage.js's pushNotif.
 *
 * SAVE THIS FILE AS: src/Pages/Doctor/DoctorPanel.jsx
 * (VideoCall.jsx and LiveMap.jsx must sit alongside it in the same folder)
 */
import { useState, useEffect, useRef, useCallback } from "react";
import VideoCall from "./VideoCall";
import LiveMap   from "./LiveMap";
import API from "../../services/api";
import {
  uid, now, todayStr,
  doctorDB, patientDB, apptDB, payDB, msgDB, notifDB,
  consultDB, prescrDB, recordDB, homeVisitDB,
  pushNotif, seedIfEmpty, VideoSessionBus,
} from "../../Storage";

seedIfEmpty();

/* helpers */
const fmtMoney = n => Number(n || 0).toLocaleString("fr-CM") + " XAF";
const monthSh  = d => d ? new Date(d).toLocaleString("default", { month: "short" }) : "";

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
  cancelled:"#ef4444", declined:"#ef4444", inactive:"#94a3b8" };
function Badge({ label, color }) {
  const c = color || SC[label?.toLowerCase()] || "#94a3b8";
  return <span style={{ background:c+"22", color:c, border:`1px solid ${c}44`, borderRadius:6, padding:"2px 10px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>{label}</span>;
}

function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const h = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:18, width:"100%", maxWidth:wide?720:480, maxHeight:"90vh", overflow:"auto", boxShadow:"0 24px 80px rgba(0,0,0,.4)", border:"1px solid #e2e8f0" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 22px", borderBottom:"1px solid #e2e8f0" }}>
          <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:16 }}>{title}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#94a3b8" }}>x</button>
        </div>
        <div style={{ padding:"18px 22px" }}>{children}</div>
      </div>
    </div>
  );
}

function useToast() {
  const [toasts, setT] = useState([]);
  const fire = (msg, type="success") => { const id=uid(); setT(t=>[...t,{id,msg,type}]); setTimeout(()=>setT(t=>t.filter(x=>x.id!==id)),3200); };
  return { toasts, fire };
}
function Toaster({ toasts }) {
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:99999, display:"flex", flexDirection:"column", gap:8 }}>
      {toasts.map(t=>(
        <div key={t.id} style={{ background:t.type==="error"?"#f44336":t.type==="warn"?"#f59e0b":"#22c55e", color:"#fff", borderRadius:12, padding:"12px 20px", fontSize:14, fontWeight:600, boxShadow:"0 8px 32px rgba(0,0,0,.3)", minWidth:220 }}>{t.msg}</div>
      ))}
    </div>
  );
}

const inp = { background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:9, padding:"9px 13px", width:"100%", fontSize:14, color:"#0f172a", outline:"none", boxSizing:"border-box", fontFamily:"inherit" };
function FRow({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#64748b", marginBottom:5, textTransform:"uppercase", letterSpacing:.6 }}>{label}</label>
      {children}
    </div>
  );
}

const NAV = [
  { section:"Overview" },
  { key:"overview",      icon:"DB", label:"Dashboard" },
  { section:"Care" },
  { key:"appointments",  icon:"AP", label:"Appointments" },
  { key:"consultations", icon:"VC", label:"Video Calls" },
  { key:"home_visits",   icon:"HV", label:"Home Visits" },
  { key:"patients",      icon:"PT", label:"My Patients" },
  { section:"Health" },
  { key:"prescriptions", icon:"RX", label:"Prescriptions" },
  { key:"records",       icon:"MR", label:"Medical Records" },
  { section:"Account" },
  { key:"payments",      icon:"PA", label:"Payments" },
  { key:"messages",      icon:"MS", label:"Messages" },
  { key:"notifications", icon:"NT", label:"Notifications" },
  { key:"profile",       icon:"PR", label:"My Profile" },
];

/* ===============================================================
   ROOT
================================================================ */
export default function DoctorPanel({ doctorId: propDoctorId, onLogout }) {
  const [doctorId] = useState(() => {
    if (propDoctorId) return propDoctorId;
    const docs = doctorDB.all();
    return docs.find(d => d.status === "active")?.id || docs[0]?.id || "d1";
  });

  const doctor = doctorDB.get(doctorId) || {};
  const [tab, setTab] = useState("overview");
  const [sideOpen, setSideOpen] = useState(false);
  const [activeCall, setActiveCall] = useState(null);
  const [callAlert, setCallAlert] = useState(null);
  const { toasts, fire: toast } = useToast();

  const [unreadNotif, setUnreadNotif] = useState(0);
  const [unreadMsg, setUnreadMsg] = useState(0);
  const [pendingAppts, setPending] = useState(0);

  const refreshBadges = () => {
    setUnreadNotif(notifDB.all().filter(n => (n.toId===doctorId) && !n.read).length);
    setUnreadMsg(msgDB.all().filter(m => m.toId===doctorId && !m.read).length);
    setPending(apptDB.forDoctor(doctorId).filter(a => a.status==="pending" && !a.createdByDoctor).length);
  };

  /* Detect a PATIENT-initiated video call session that's waiting
     for the doctor (patient has joined VideoSessionBus already). */
  useEffect(() => {
    const checkIncoming = () => {
      if (activeCall || callAlert) return;
      const myConsults = consultDB.forDoctor(doctorId).filter(c => c.type === "video" && c.status === "scheduled");
      for (const c of myConsults) {
        const session = VideoSessionBus.getActive(c.id);
        if (session) {
          const msgs = VideoSessionBus.getMessages(session.id);
          const patientJoined = msgs.some(m => m.fromId === c.patientId);
          if (patientJoined && !c.doctorAlerted) {
            consultDB.update(c.id, { doctorAlerted: true });
            setCallAlert(c);
            break;
          }
        }
      }
    };
    checkIncoming();
    const t = setInterval(checkIncoming, 2500);
    return () => clearInterval(t);
  }, [doctorId, activeCall, callAlert]);

  useEffect(() => {
    refreshBadges();
    const t = setInterval(refreshBadges, 3000);
    return () => clearInterval(t);
  }, [doctorId]);

  const sp = { doctorId, doctor, toast, refreshBadges };

  if (activeCall) return (
    <VideoCall
      consultation={activeCall}
      localUser={{ id: doctorId, name: doctor.name || "Doctor", role: "doctor" }}
      onEnd={() => {
        consultDB.update(activeCall.id, { status: "completed" });
        toast("Session ended and marked complete.");
        setActiveCall(null);
        refreshBadges();
      }}
    />
  );

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:"#f0f4f9", fontFamily:"'DM Sans',sans-serif", color:"#0f172a" }}>
      <style>{CSS}</style>

      {callAlert && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.7)", zIndex:99999, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:"#fff", borderRadius:24, padding:"36px 32px", maxWidth:420, width:"100%", textAlign:"center", boxShadow:"0 32px 80px rgba(0,0,0,.3)", border:"2px solid rgba(0,191,165,.3)" }}>
            <div style={{ width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg,#00bfa5,#0891b2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:30, margin:"0 auto 16px", color:"#fff", fontWeight:800 }}>VC</div>
            <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:20, marginBottom:6 }}>Incoming Video Call</h2>
            <p style={{ color:"#64748b", fontSize:14, marginBottom:4 }}><strong>{callAlert.patientName}</strong> is waiting for you in the video room</p>
            <p style={{ color:"#94a3b8", fontSize:12, marginBottom:24 }}>{callAlert.date} at {callAlert.time}</p>
            <div style={{ display:"flex", gap:12 }}>
              <button onClick={() => {
                setCallAlert(null);
                consultDB.update(callAlert.id, { status:"cancelled" });
                pushNotif(callAlert.patientId, "consultation", "Call Declined", `Dr. ${doctor.name} is unavailable right now.`);
                toast("Call declined.","warn");
              }} style={{ flex:1, padding:"13px", borderRadius:14, border:"2px solid #e2e8f0", background:"#f8fafc", color:"#64748b", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                Decline
              </button>
              <button onClick={() => { setCallAlert(null); setActiveCall(callAlert); }}
                style={{ flex:2, padding:"13px", borderRadius:14, border:"none", background:"linear-gradient(135deg,#00bfa5,#0891b2)", color:"#fff", fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>
                Join Now
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className={`dp-sidebar${sideOpen?" open":""}`}>
        <div className="dp-brand">
          <div className="dp-brand-orb">+</div>
          <div>
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:15, color:"#fff" }}>STECH</div>
            <div style={{ fontSize:10, color:"#94a3b8", letterSpacing:1.5, textTransform:"uppercase" }}>Doctor Portal</div>
          </div>
        </div>
        <div style={{ margin:"0 12px 8px", padding:12, background:"rgba(255,255,255,.06)", borderRadius:12, display:"flex", gap:10, alignItems:"center" }}>
          <Avatar name={doctor.name || "Dr"} size={40} src={doctor.avatar}/>
          <div style={{ overflow:"hidden" }}>
            <div style={{ color:"#fff", fontWeight:700, fontSize:13, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{doctor.name || "Doctor"}</div>
            <div style={{ color:"#00bfa5", fontSize:11, fontWeight:600 }}>{doctor.specialty || "Specialist"}</div>
          </div>
        </div>
        <nav className="dp-nav">
          {NAV.map((n,i) => {
            if (n.section) return <div key={i} className="dp-nav-section">{n.section}</div>;
            const badge = n.key==="notifications" ? unreadNotif : n.key==="messages" ? unreadMsg : n.key==="appointments" ? pendingAppts : 0;
            return (
              <button key={n.key} className={`dp-nav-item${tab===n.key?" active":""}`} onClick={() => { setTab(n.key); setSideOpen(false); }}>
                <span className="dp-nav-icon">{n.icon}</span>
                <span>{n.label}</span>
                {badge>0 && <span className="dp-nav-badge">{badge}</span>}
              </button>
            );
          })}
        </nav>
        <button className="dp-logout" onClick={onLogout}>Logout</button>
      </aside>

      <div className="dp-main">
        <header className="dp-topbar">
          <button className="dp-hamburger" onClick={() => setSideOpen(s=>!s)}>Menu</button>
          <div style={{ flex:1 }}/>
          <button className="dp-topbar-icon" onClick={() => setTab("consultations")} style={{ color:"#00bfa5" }}>Video</button>
          <button className="dp-topbar-icon" onClick={() => setTab("messages")}>Msg{unreadMsg>0 && <sup className="dp-top-badge">{unreadMsg}</sup>}</button>
          <button className="dp-topbar-icon" onClick={() => setTab("notifications")}>Bell{unreadNotif>0 && <sup className="dp-top-badge">{unreadNotif}</sup>}</button>
          <div onClick={() => setTab("profile")} style={{ cursor:"pointer" }}><Avatar name={doctor.name} size={32} src={doctor.avatar}/></div>
        </header>

        <main className="dp-content">
          {tab==="overview"      && <DocSchedules    {...sp} onStartCall={setActiveCall}/>}
          {tab==="appointments"  && <DocAppointments  {...sp} onStartCall={setActiveCall}/>}
          {tab==="consultations" && <DocConsultations {...sp} onStartCall={setActiveCall}/>}
          {tab==="home_visits"   && <DocHomeVisits    {...sp}/>}
          {tab==="patients"      && <DocPatients      {...sp}/>}
          {tab==="prescriptions" && <DocPrescriptions {...sp}/>}
          {tab==="records"       && <DocRecords       {...sp}/>}
          {tab==="payments"      && <DocPayments      {...sp}/>}
          {tab==="messages"      && <DocMessages      {...sp}/>}
          {tab==="notifications" && <DocNotifications {...sp}/>}
          {tab==="profile"       && <DocProfile       {...sp}/>}
        </main>
      </div>

      {sideOpen && <div className="dp-overlay" onClick={() => setSideOpen(false)}/>}
      <Toaster toasts={toasts}/>
    </div>
  );
}

/* ===============================================================
   OVERVIEW
================================================================ */
function DocSchedules({ doctorId, doctor, toast, onStartCall }) {
  const today = todayStr();
  const [mongoVideos, setMongoVideos] = useState([]);
  
  useEffect(() => {
    import("../../services/api").then(API => {
      API.default.get("/appointments/doctor").then(({data}) => {
        if(data?.appointments) {
          const vids = data.appointments.filter(a => a.isVideoConsultation || a.type === 'video' || a.sessionType === 'video' || a.healthType?.toLowerCase().includes('video')).map(a => ({
            ...a, id: a.roomId || a._id, patientName: a.patientId?.name || a.patientName, type: "video"
          }));
          setMongoVideos(vids);
        }
      }).catch(()=>{});
    });
  }, [doctorId]);

  const todayAppts = apptDB.forDoctor(doctorId).filter(a => a.date === today);
  const pending = apptDB.forDoctor(doctorId).filter(a => a.status === "pending" && !a.createdByDoctor);
  const localVideoWaiting = consultDB.forDoctor(doctorId).filter(c => c.type === "video" && c.status === "scheduled");
  const videoWaiting = [...localVideoWaiting, ...mongoVideos];
  
  const revenue = payDB.all().filter(p => p.doctorId === doctorId && p.status === "paid").reduce((s, p) => s + p.amount, 0);

  const hr = new Date().getHours();
  const greeting = hr<12 ? "Good Morning" : hr<18 ? "Good Afternoon" : "Good Evening";
  const firstName = doctor.name?.split(" ").slice(-1)[0] || "Doctor";

  const stats = [
    { label:"Today's Appts",   value:todayAppts.length,    color:"#1e88e5" },
    { label:"Pending Requests",value:pending.length,        color:"#fbbf24" },
    { label:"Video Calls",      value:videoWaiting.length,   color:"#00bfa5", nav:"consultations" },
    { label:"Revenue",          value:`${(revenue/1000).toFixed(1)}K XAF`, color:"#16a34a" },
  ];

  return (
    <div className="dp-anim">
      <div className="dp-page-head">
        <div>
          <h1 className="dp-title">{greeting}, Dr. {firstName}</h1>
          <p className="dp-sub">{doctor.specialty} - {new Date().toDateString()}</p>
        </div>
      </div>

      <div className="dp-stats">
        {stats.map(s => (
          <div key={s.label} className="dp-stat-card" style={{ "--acc":s.color, cursor:s.nav?"pointer":"default" }} onClick={() => s.nav && setTab(s.nav)}>
            <div style={{ fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:.6 }}>{s.label}</div>
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:24 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {videoWaiting.length > 0 && (
        <div style={{ background:"linear-gradient(110deg,#003d33,#00574a)", borderRadius:16, padding:"18px 22px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
          <div>
            <div style={{ fontWeight:800, fontSize:16, color:"#fff" }}>{videoWaiting.length} scheduled video consultation{videoWaiting.length>1?"s":""}</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,.6)", marginTop:3 }}>
              Next: {videoWaiting[0]?.patientName} - {videoWaiting[0]?.date} at {videoWaiting[0]?.time}
            </div>
          </div>
          <button onClick={() => onStartCall(videoWaiting[0])} style={{ background:"#00bfa5", color:"#fff", border:"none", borderRadius:12, padding:"12px 22px", fontWeight:800, cursor:"pointer", fontSize:14, fontFamily:"inherit" }}>
            Join Now
          </button>
        </div>
      )}

      <div className="dp-two-col">
        <div className="dp-card">
          <div className="dp-card-head"><div className="dp-card-title">Today's Schedule</div></div>
          {todayAppts.length === 0
            ? <div className="dp-empty"><p>No appointments today.</p></div>
            : todayAppts.map(a => (
              <div key={a.id} className="dp-row">
                <span style={{ fontWeight:700, fontSize:13, minWidth:50 }}>{a.time}</span>
                <Avatar name={a.patientName} size={36}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>{a.patientName}</div>
                  <div style={{ fontSize:12, color:"#64748b" }}>{a.healthType}</div>
                </div>
                <Badge label={a.status}/>
              </div>
            ))}
        </div>

        <div className="dp-card">
          <div className="dp-card-head"><div className="dp-card-title">Pending Requests</div></div>
          {pending.length === 0
            ? <div className="dp-empty"><p>All clear.</p></div>
            : pending.slice(0,5).map(a => (
              <div key={a.id} className="dp-row">
                <Avatar name={a.patientName} size={36}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>{a.patientName}</div>
                  <div style={{ fontSize:12, color:"#64748b" }}>{a.healthType} - {a.date} {a.time}</div>
                </div>
                <Badge label="pending"/>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

/* ===============================================================
   APPOINTMENTS
   Doctor-created appointments: status "pending", createdByDoctor:true
   -> patient must accept/reject in their My Schedule tab.
   Patient-created appointments: doctor can confirm/cancel directly.
================================================================ */
function DocAppointments({ doctorId, doctor, toast, onStartCall }) {
  const [items, setItems] = useState([]);
  const [mongoItems, setMongoItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [addOpen, setAdd] = useState(false);
  const TYPES = ["Consultation","Root Canal","Scaling","Whitening","Wisdom Teeth","Braces Check","Implant","X-Ray","Check-up","Emergency"];

  const refresh = () => {
    setItems(apptDB.forDoctor(doctorId));
    API.get("/appointments/doctor").then(({data}) => {
      if(data?.appointments) {
        setMongoItems(data.appointments.map(a => ({
          ...a, id: a._id, patientName: a.patientId?.name || a.patientName,
          status: a.status.toLowerCase()
        })));
      }
    }).catch(()=>{});
  };
  useEffect(() => refresh(), [doctorId]);

  const allItems = [...items, ...mongoItems];
  const filtered = allItems.filter(a => filter==="all" || a.status===filter);

  const updateStatus = (id, status) => {
    const a = apptDB.update(id, { status });
    pushNotif(a?.patientId, "appointment", "Appointment Update", `Your appointment is now ${status}.`);
    pushNotif("admin", "appointment", "Appointment Updated", `${a?.patientName}'s appointment with ${doctor.name} is ${status}.`);
    toast(`Status -> ${status}`); refresh();
  };

  const blank = { patientId:"", healthType:"", date:"", time:"09:00", notes:"" };
  const [form, setForm] = useState(blank);
  const patients = patientDB.all().filter(p => p.status !== "deleted");

  const createAppt = () => {
    if (!form.patientId || !form.healthType || !form.date) { toast("Fill required fields","error"); return; }
    const p = patients.find(x => x.id === form.patientId);
    apptDB.add({
      ...form, id: uid(), doctorId, doctorName: doctor.name,
      patientId: form.patientId, patientName: p?.name,
      status: "pending",
      createdByDoctor: true,
      sessionType: "in-clinic",
      amount: p?.consultFee || doctor.consultFee || 15000,
      createdAt: now(),
    });
    pushNotif(p?.id, "appointment", "New Appointment Scheduled",
      `Dr. ${doctor.name} scheduled a ${form.healthType} on ${form.date} at ${form.time}. Please accept or reject in My Schedule.`);
    pushNotif("admin", "appointment", "Doctor Scheduled Appointment",
      `${doctor.name} -> ${p?.name}: ${form.healthType} on ${form.date}. Awaiting patient response.`);
    toast("Appointment sent to patient for confirmation!");
    setForm(blank); setAdd(false); refresh();
  };

  return (
    <div className="dp-anim">
      <div className="dp-page-head">
        <div><h1 className="dp-title">Appointments</h1><p className="dp-sub">{items.length} total</p></div>
        <button className="dp-btn-primary" onClick={() => setAdd(true)}>+ Schedule for Patient</button>
      </div>

      <div className="dp-card">
        <div className="dp-filter-tabs">
          {["all","pending","confirmed","cancelled"].map(f => (
            <button key={f} className={`dp-filter-tab${filter===f?" active":""}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
        <div className="dp-tbl-wrap">
          <table className="dp-table">
            <thead><tr><th>Patient</th><th>Type</th><th>Date</th><th>Time</th><th>Source</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {filtered.length===0 && <tr><td colSpan={7} style={{textAlign:"center",padding:32,color:"#94a3b8"}}>No appointments.</td></tr>}
              {filtered.map(a => (
                <tr key={a.id}>
                  <td><div style={{ display:"flex", alignItems:"center", gap:8 }}><Avatar name={a.patientName} size={26}/>{a.patientName}</div></td>
                  <td>{a.sessionType==="video"?"[Video] ":a.sessionType==="home-visit"?"[Home] ":""}{a.healthType}</td>
                  <td>{a.date}</td>
                  <td>{a.time}</td>
                  <td style={{ fontSize:11, fontWeight:700, color: a.createdByDoctor ? "#7c3aed" : "#1e88e5" }}>{a.createdByDoctor ? "Doctor" : "Patient"}</td>
                  <td><Badge label={a.status}/></td>
                  <td>
                    {a.status === "pending" && !a.createdByDoctor && (
                      <div style={{ display:"flex", gap:6 }}>
                        <button className="dp-btn-primary" style={{ padding:"4px 10px", fontSize:11 }} onClick={() => updateStatus(a.id, "confirmed")}>Accept</button>
                        <button className="dp-btn-primary" style={{ padding:"4px 10px", fontSize:11, background:"#ef4444" }} onClick={() => updateStatus(a.id, "cancelled")}>Reject</button>
                      </div>
                    )}
                    {(a.isVideoConsultation || a.type === 'video' || a.sessionType === 'video' || a.healthType?.toLowerCase().includes('video')) && (a.status === "confirmed" || a.status === "scheduled" || a.status === "pending" || a.status === "PENDING") && (
                      <button className="dp-btn-primary" style={{ padding:"6px 14px", fontSize:12, marginTop:4 }} onClick={() => onStartCall(a)}>
                        Join Video
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {addOpen && (
        <Modal title="Schedule Appointment for Patient" onClose={() => setAdd(false)}>
          <div style={{ background:"rgba(124,58,237,.07)", border:"1px solid rgba(124,58,237,.2)", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#7c3aed", marginBottom:14 }}>
            The patient will receive a notification and must accept or reject this in their My Schedule tab.
          </div>
          <FRow label="Patient *">
            <select style={inp} value={form.patientId} onChange={e => setForm(f=>({...f,patientId:e.target.value}))}>
              <option value="">Select patient...</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </FRow>
          <FRow label="Treatment Type *">
            <select style={inp} value={form.healthType} onChange={e => setForm(f=>({...f,healthType:e.target.value}))}>
              <option value="">Select type...</option>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FRow>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <FRow label="Date *"><input style={inp} type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))}/></FRow>
            <FRow label="Time">
              <select style={inp} value={form.time} onChange={e => setForm(f=>({...f,time:e.target.value}))}>
                {["08:00","09:00","10:00","11:00","14:00","15:00","16:00"].map(t => <option key={t}>{t}</option>)}
              </select>
            </FRow>
          </div>
          <FRow label="Notes"><textarea style={{...inp,height:72,resize:"vertical"}} value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))}/></FRow>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button className="dp-ghost" onClick={() => setAdd(false)}>Cancel</button>
            <button className="dp-btn-primary" onClick={createAppt}>Send to Patient</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ===============================================================
   CONSULTATIONS / VIDEO CALLS
   Doctor-created -> doctorInitiated:true, status:"scheduled".
   This is the flag PatientPanel's root polls for:
     c.patientId===patientId && c.type==="video" && c.status==="scheduled"
     && c.doctorInitiated && !c.patientAlerted
   so the incoming-call modal fires on the PATIENT side when the
   DOCTOR schedules the call - and vice versa via VideoSessionBus
   detection when the PATIENT books one themselves (sessType:"video"
   in PatBooking, which does NOT set doctorInitiated, so it instead
   relies on this DoctorPanel's own VideoSessionBus.getActive poll).
================================================================ */
function DocConsultations({ doctorId, doctor, toast, onStartCall }) {
  const [items, setItems] = useState([]);
  const [mongoItems, setMongoItems] = useState([]);
  const [addOpen, setAdd] = useState(false);
  const patients = patientDB.all().filter(p => p.status !== "deleted");
  
  const refresh = () => {
    setItems(consultDB.forDoctor(doctorId));
    API.get("/appointments/doctor").then(({data}) => {
      if(data?.appointments) {
        const vids = data.appointments.filter(a => a.isVideoConsultation || a.type === 'video' || a.sessionType === 'video' || a.healthType?.toLowerCase().includes('video')).map(a => ({
          ...a,
          id: a.roomId || a._id,
          patientId: a.patientId?._id || a.patientId,
          patientName: a.patientId?.name || a.patientName || 'Patient',
          type: "video",
          status: a.status === "PENDING" ? "scheduled" : a.status.toLowerCase()
        }));
        setMongoItems(vids);
      }
    }).catch(()=>{});
  };
  useEffect(() => refresh(), [doctorId]);

  const allItems = [...items, ...mongoItems];

  const blank = { patientId:"", type:"video", date:"", time:"10:00", notes:"" };
  const [form, setForm] = useState(blank);

  const create = () => {
    if (!form.patientId || !form.date) { toast("Fill required fields","error"); return; }
    
    import("../../services/api").then(API => {
      API.default.post("/appointments", {
        doctorId,
        patientId: form.patientId,
        healthType: form.notes || "Video Consultation",
        date: form.date,
        time: form.time,
        notes: "Scheduled by Doctor",
        isVideoConsultation: true,
        roomId: uid(),
        amount: 0,
        status: "scheduled"
      }).then(() => {
        toast("Video consultation scheduled successfully!");
        setForm(blank);
        setAdd(false);
        refresh();
      }).catch(err => {
        toast("Failed to schedule: " + (err.response?.data?.message || err.message), "error");
      });
    });
  };

  return (
    <div className="dp-anim">
      <div className="dp-page-head">
        <div><h1 className="dp-title">Video Calls</h1><p className="dp-sub">Real-time consultations</p></div>
        <button className="dp-btn-primary" onClick={() => setAdd(true)}>+ Schedule</button>
      </div>

      <div className="dp-card">
        <div className="dp-tbl-wrap">
          <table className="dp-table">
            <thead><tr><th>Patient</th><th>Type</th><th>Date</th><th>Time</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {allItems.length===0 && <tr><td colSpan={6} style={{textAlign:"center",padding:32,color:"#94a3b8"}}>No consultations yet.</td></tr>}
              {allItems.map(c => (
                <tr key={c.id}>
                  <td><div style={{ display:"flex", alignItems:"center", gap:8 }}><Avatar name={c.patientName} size={26}/>{c.patientName}</div></td>
                  <td>{c.type}</td>
                  <td>{c.date}</td>
                  <td>{c.time}</td>
                  <td><Badge label={c.status}/></td>
                  <td>
                    {c.status === "scheduled" && (
                      <button className="dp-btn-primary" style={{ padding:"6px 14px", fontSize:12 }} onClick={() => onStartCall(c)}>
                        Join Video
                      </button>
                    )}
                    {c.status === "completed" && <Badge label="Done" color="#22c55e"/>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {addOpen && (
        <Modal title="Schedule Video Consultation" onClose={() => setAdd(false)}>
          <div style={{ background:"rgba(0,191,165,.07)", border:"1px solid rgba(0,191,165,.2)", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#00897b", marginBottom:14 }}>
            A real shared video room is created. The patient gets an incoming-call alert and a "Join Video" button. When you both join, you share one live room.
          </div>
          <FRow label="Patient *">
            <select style={inp} value={form.patientId} onChange={e => setForm(f=>({...f,patientId:e.target.value}))}>
              <option value="">Select patient...</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </FRow>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <FRow label="Date *"><input style={inp} type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))}/></FRow>
            <FRow label="Time">
              <select style={inp} value={form.time} onChange={e => setForm(f=>({...f,time:e.target.value}))}>
                {["09:00","10:00","11:00","13:00","14:00","15:00","16:00"].map(t => <option key={t}>{t}</option>)}
              </select>
            </FRow>
          </div>
          <FRow label="Notes"><textarea style={{...inp,height:72,resize:"vertical"}} value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))}/></FRow>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button className="dp-ghost" onClick={() => setAdd(false)}>Cancel</button>
            <button className="dp-btn-primary" onClick={create}>Schedule</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ===============================================================
   HOME VISITS
================================================================ */
function DocHomeVisits({ doctorId, doctor, toast }) {
  const [items, setItems] = useState([]);
  const [mongoItems, setMongoItems] = useState([]);
  const [addOpen, setAdd] = useState(false);
  const [mapVisit, setMapV] = useState(null);
  const patients = patientDB.all().filter(p => p.status !== "deleted");
  const blank = { patientId:"", address:"", date:"", time:"09:00", service:"", notes:"" };
  const [form, setForm] = useState(blank);
  const refresh = () => {
    setItems(homeVisitDB.forDoctor(doctorId));
    import("../../services/api").then(API => {
      API.default.get("/appointments/doctor").then(({data}) => {
        if(data?.appointments) {
          const mVisits = data.appointments.filter(a => a.isHomeVisit || a.type === 'home').map(a => ({
            ...a, id: a.trackingId || a._id,
            patientId: a.patientId?._id || a.patientId,
            patientName: a.patientId?.name || a.patientName || 'Patient',
            service: a.healthType,
            address: a.visitAddress || "No address provided",
            status: a.status === "PENDING" ? "scheduled" : a.status.toLowerCase()
          }));
          setMongoItems(mVisits);
        }
      }).catch(()=>{});
    });
  };
  useEffect(() => refresh(), [doctorId]);

  const allItems = [...items, ...mongoItems];

  const create = () => {
    if (!form.patientId || !form.date || !form.address) { toast("Fill required fields","error"); return; }
    
    import("../../services/api").then(API => {
      API.default.post("/appointments", {
        doctorId,
        patientId: form.patientId,
        healthType: form.service || "Home Visit",
        date: form.date,
        time: form.time,
        notes: form.notes || "Scheduled by Doctor",
        isHomeVisit: true,
        visitAddress: form.address,
        trackingId: uid(),
        amount: 0,
        status: "scheduled"
      }).then(() => {
        toast("Home visit scheduled successfully!");
        setForm(blank);
        setAdd(false);
        refresh();
      }).catch(err => {
        toast("Failed to schedule: " + (err.response?.data?.message || err.message), "error");
      });
    });
  };

  const updateStatus = (id, status, patientId) => {
    homeVisitDB.update(id, { status });
    pushNotif(patientId, "home_visit", "Visit Status Update",
      status === "accepted"
        ? `Dr. ${doctor.name} accepted your home visit request! Live tracking is now active.`
        : `Your home visit status has been updated to: ${status}.`);
    toast(status === "accepted" ? "Visit accepted - tracking live!" : `Visit ${status}`);
    refresh();
  };

  if (mapVisit) return (
    <div className="dp-anim">
      <div className="dp-page-head">
        <div><h1 className="dp-title">Live Route</h1><p className="dp-sub">Tracking to {mapVisit.patientName}</p></div>
        <button className="dp-ghost" onClick={() => setMapV(null)}>Back</button>
      </div>
      <div className="dp-card">
        <LiveMap visit={mapVisit} role="doctor"/>
        <div style={{ marginTop:14, display:"flex", justifyContent:"flex-end" }}>
          <button className="dp-btn-primary" style={{ background:"#16a34a" }} onClick={() => { updateStatus(mapVisit.id,"completed",mapVisit.patientId); setMapV(null); }}>
            Mark Completed
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dp-anim">
      <div className="dp-page-head">
        <div><h1 className="dp-title">Home Visits</h1></div>
        <button className="dp-btn-primary" onClick={() => setAdd(true)}>+ Schedule Visit</button>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {allItems.length===0 && <div className="dp-card"><div className="dp-empty"><p>No home visits scheduled.</p></div></div>}
        {allItems.map(r => (
          <div key={r.id} className="dp-card">
            <div style={{ display:"flex", alignItems:"flex-start", gap:16, flexWrap:"wrap" }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                  <Avatar name={r.patientName} size={44}/>
                  <div>
                    <div style={{ fontWeight:700, fontSize:16 }}>{r.patientName}</div>
                    <div style={{ fontSize:13, color:"#64748b" }}>{r.service || "Home Visit"}</div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:16, fontSize:13, color:"#64748b", flexWrap:"wrap" }}>
                  <span>{r.address}</span><span>{r.date}{r.time && ` at ${r.time}`}</span>
                </div>
                {r.createdByDoctor && (r.status==="scheduled" || r.status==="pending") && (
                  <div style={{ marginTop:8, fontSize:12, color:"#7c3aed", fontStyle:"italic" }}>Awaiting patient response</div>
                )}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8, alignItems:"flex-end" }}>
                <Badge label={r.status}/>
                <div style={{ display:"flex", gap:6 }}>
                  {r.status === "pending" && !r.createdByDoctor && (
                    <>
                      <button className="dp-btn-primary" style={{ padding:"4px 10px", fontSize:11 }} onClick={() => updateStatus(r.id,"accepted",r.patientId)}>Accept</button>
                      <button className="dp-btn-primary" style={{ padding:"4px 10px", fontSize:11, background:"#ef4444" }} onClick={() => updateStatus(r.id,"declined",r.patientId)}>Reject</button>
                    </>
                  )}
                  {(r.status === "scheduled" || r.status === "pending" || r.status === "confirmed") && (
                    <button className="dp-btn-primary" onClick={() => setMapV(r)}>Start Tracking Map</button>
                  )}
                  {r.status === "accepted" && (
                    <button className="dp-btn-primary" onClick={() => setMapV(r)}>View Live Map</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {addOpen && (
        <Modal title="Schedule Home Visit" onClose={() => setAdd(false)}>
          <FRow label="Patient *">
            <select style={inp} value={form.patientId} onChange={e => setForm(f=>({...f,patientId:e.target.value}))}>
              <option value="">Select patient...</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </FRow>
          <FRow label="Address *"><input style={inp} value={form.address} onChange={e => setForm(f=>({...f,address:e.target.value}))}/></FRow>
          <FRow label="Service"><input style={inp} value={form.service} onChange={e => setForm(f=>({...f,service:e.target.value}))}/></FRow>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <FRow label="Date *"><input style={inp} type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))}/></FRow>
            <FRow label="Time">
              <select style={inp} value={form.time} onChange={e => setForm(f=>({...f,time:e.target.value}))}>
                {["08:00","09:00","10:00","11:00","14:00","15:00","16:00"].map(t => <option key={t}>{t}</option>)}
              </select>
            </FRow>
          </div>
          <FRow label="Notes"><textarea style={{...inp,height:72,resize:"vertical"}} value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))}/></FRow>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button className="dp-ghost" onClick={() => setAdd(false)}>Cancel</button>
            <button className="dp-btn-primary" onClick={create}>Send to Patient</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ===============================================================
   MY PATIENTS
================================================================ */
function DocPatients({ doctorId }) {
  const myAppts = apptDB.forDoctor(doctorId);
  const patientIds = [...new Set(myAppts.map(a => a.patientId))];
  const patients = patientDB.all().filter(p => patientIds.includes(p.id));

  return (
    <div className="dp-anim">
      <div className="dp-page-head"><div><h1 className="dp-title">My Patients</h1><p className="dp-sub">{patients.length} patients</p></div></div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:16 }}>
        {patients.length===0 && <div className="dp-card"><div className="dp-empty"><p>No patients yet.</p></div></div>}
        {patients.map(p => (
          <div key={p.id} className="dp-card">
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
              <Avatar name={p.name} size={44} src={p.avatar}/>
              <div>
                <div style={{ fontWeight:700, fontSize:15 }}>{p.name}</div>
                <div style={{ fontSize:12, color:"#64748b" }}>{p.email}</div>
              </div>
            </div>
            <div style={{ fontSize:13, color:"#64748b" }}>Blood: {p.bloodType || "—"}</div>
            <div style={{ fontSize:13, color:"#64748b" }}>Allergies: {p.allergies || "None"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===============================================================
   PRESCRIPTIONS
================================================================ */
function DocPrescriptions({ doctorId, doctor, toast }) {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(false);
  const patients = patientDB.all().filter(p => p.status !== "deleted");
  const blank = { patientId:"", medication:"", dosage:"", duration:"", notes:"" };
  const [form, setForm] = useState(blank);
  const refresh = () => setItems(prescrDB.forDoctor(doctorId));
  useEffect(() => refresh(), [doctorId]);

  const submit = () => {
    if (!form.patientId || !form.medication) { toast("Fill required fields","error"); return; }
    const p = patients.find(x => x.id === form.patientId);
    prescrDB.add({
      ...form, id: uid(), doctorId, doctorName: doctor.name,
      patientId: form.patientId, patientName: p?.name,
      date: todayStr(), createdAt: now(),
    });
    pushNotif(p?.id, "prescription", `New Prescription from Dr. ${doctor.name}`,
      `${form.medication} - ${form.dosage} for ${form.duration}. View & download it in your Prescriptions tab.`);
    pushNotif("admin", "prescription", "Prescription Issued", `${doctor.name} prescribed ${form.medication} to ${p?.name}.`);
    toast("Prescription issued - patient notified!"); setForm(blank); setModal(false); refresh();
  };

  return (
    <div className="dp-anim">
      <div className="dp-page-head">
        <div><h1 className="dp-title">Prescriptions</h1><p className="dp-sub">{items.length} issued</p></div>
        <button className="dp-btn-primary" onClick={() => setModal(true)}>+ New Prescription</button>
      </div>
      <div className="dp-card">
        <div className="dp-tbl-wrap">
          <table className="dp-table">
            <thead><tr><th>Patient</th><th>Medication</th><th>Dosage</th><th>Duration</th><th>Date</th></tr></thead>
            <tbody>
              {items.length===0 && <tr><td colSpan={5} style={{textAlign:"center",padding:32,color:"#94a3b8"}}>No prescriptions yet.</td></tr>}
              {items.map(p => (
                <tr key={p.id}>
                  <td><div style={{ display:"flex", alignItems:"center", gap:8 }}><Avatar name={p.patientName} size={26}/>{p.patientName}</div></td>
                  <td style={{ fontWeight:700 }}>{p.medication}</td>
                  <td>{p.dosage}</td><td>{p.duration}</td><td>{p.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal && (
        <Modal title="New Prescription" onClose={() => setModal(false)}>
          <FRow label="Patient *">
            <select style={inp} value={form.patientId} onChange={e => setForm(f=>({...f,patientId:e.target.value}))}>
              <option value="">Select patient...</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </FRow>
          <FRow label="Medication *"><input style={inp} value={form.medication} onChange={e => setForm(f=>({...f,medication:e.target.value}))}/></FRow>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <FRow label="Dosage"><input style={inp} value={form.dosage} onChange={e => setForm(f=>({...f,dosage:e.target.value}))}/></FRow>
            <FRow label="Duration"><input style={inp} value={form.duration} onChange={e => setForm(f=>({...f,duration:e.target.value}))}/></FRow>
          </div>
          <FRow label="Instructions"><textarea style={{...inp,height:72,resize:"vertical"}} value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))}/></FRow>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button className="dp-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button className="dp-btn-primary" onClick={submit}>Issue Prescription</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ===============================================================
   MEDICAL RECORDS
================================================================ */
function DocRecords({ doctorId, doctor, toast }) {
  const patients = patientDB.all().filter(p => p.status !== "deleted");
  const [selPat, setSelPat] = useState("");
  const [records, setRecords] = useState([]);
  const [modal, setModal] = useState(false);
  const blank = { title:"", type:"procedure", description:"" };
  const [form, setForm] = useState(blank);
  const TYPES = ["procedure","imaging","lab","prescription","note","diagnosis"];

  const refresh = () => { if (selPat) setRecords(recordDB.forPatient(selPat)); };
  useEffect(() => refresh(), [selPat]);

  const submit = () => {
    if (!selPat || !form.title) { toast("Select a patient and fill the title","error"); return; }
    const p = patients.find(x => x.id === selPat);
    recordDB.add({
      ...form, id: uid(), patientId: selPat, patientName: p?.name,
      doctorId, doctorName: doctor.name, date: todayStr(), createdAt: now(),
    });
    pushNotif(p?.id, "record", "New Medical Record",
      `Dr. ${doctor.name} added: ${form.title}. View & download it in your Medical Records tab.`);
    pushNotif("admin", "record", "Medical Record Added", `${doctor.name} added a record for ${p?.name}.`);
    toast("Record saved - patient notified!"); setForm(blank); setModal(false); refresh();
  };

  return (
    <div className="dp-anim">
      <div className="dp-page-head">
        <div><h1 className="dp-title">Medical Records</h1></div>
        <button className="dp-btn-primary" onClick={() => setModal(true)} style={{ opacity: selPat ? 1 : .5 }}>+ Add Record</button>
      </div>
      <div className="dp-card" style={{ marginBottom:16 }}>
        <FRow label="Select Patient">
          <select style={{ ...inp, maxWidth:320 }} value={selPat} onChange={e => setSelPat(e.target.value)}>
            <option value="">Choose a patient...</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </FRow>
      </div>
      {selPat && (
        <div className="dp-card">
          {records.length===0
            ? <div className="dp-empty"><p>No records for this patient.</p></div>
            : records.map(r => (
              <div key={r.id} style={{ padding:"14px 0", borderBottom:"1px solid #e2e8f0" }}>
                <div style={{ display:"flex", justifyContent:"space-between", gap:8, flexWrap:"wrap" }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:15 }}>{r.title}</div>
                    <div style={{ fontSize:13, color:"#64748b", marginTop:4 }}>{r.description}</div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <Badge label={r.type} color="#1e88e5"/>
                    <span style={{ fontSize:12, color:"#94a3b8" }}>{r.date}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
      {modal && (
        <Modal title="Add Medical Record" onClose={() => setModal(false)}>
          <FRow label="Title *"><input style={inp} value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))}/></FRow>
          <FRow label="Type">
            <select style={inp} value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))}>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FRow>
          <FRow label="Description"><textarea style={{...inp,height:90,resize:"vertical"}} value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))}/></FRow>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button className="dp-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button className="dp-btn-primary" onClick={submit}>Save Record</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ===============================================================
   PAYMENTS
================================================================ */
function DocPayments({ doctorId }) {
  const items = payDB.forDoctor(doctorId);
  const totalPaid = items.filter(p => p.status==="paid").reduce((s,p) => s+p.amount, 0);

  return (
    <div className="dp-anim">
      <div className="dp-page-head"><div><h1 className="dp-title">Payments</h1><p className="dp-sub">Total earned: {fmtMoney(totalPaid)}</p></div></div>
      <div className="dp-card">
        <div className="dp-tbl-wrap">
          <table className="dp-table">
            <thead><tr><th>Patient</th><th>Service</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {items.length===0 && <tr><td colSpan={5} style={{textAlign:"center",padding:32,color:"#94a3b8"}}>No payments yet.</td></tr>}
              {items.map(p => (
                <tr key={p.id}>
                  <td>{p.patientName}</td><td>{p.service}</td>
                  <td style={{ fontWeight:700 }}>{fmtMoney(p.amount)}</td>
                  <td><Badge label={p.status}/></td><td>{p.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ===============================================================
   MESSAGES - duplex chat, mirrors to admin via pushNotif inside Storage
================================================================ */
function DocMessages({ doctorId, doctor, toast, refreshBadges }) {
  const patients = patientDB.all().filter(p => p.status !== "deleted");
  const contacts = [{ id:"admin", name:"Administrator", role:"Admin" }, ...patients.map(p => ({ ...p, role:"Patient" }))];
  const [selId, setSelId] = useState("admin");
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  const loadMsgs = useCallback(() => {
    const all = msgDB.all();
    const thread = all.filter(m => (m.fromId===doctorId && m.toId===selId) || (m.fromId===selId && m.toId===doctorId))
      .sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
    setMsgs(thread);
    msgDB.all().filter(m => m.toId===doctorId && !m.read).forEach(m => msgDB.update(m.id,{read:true}));
    refreshBadges();
  }, [selId, doctorId]);

  useEffect(() => { loadMsgs(); }, [selId, doctorId]);
  useEffect(() => { const t = setInterval(loadMsgs, 1500); return () => clearInterval(t); }, [loadMsgs]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  const send = () => {
    if (!input.trim() || !selId) return;
    const sel = contacts.find(c => c.id === selId);
    msgDB.add({ id: uid(), fromId: doctorId, fromName: doctor.name, toId: selId, toName: sel?.name, body: input.trim(), read: false, createdAt: now() });
    pushNotif(selId, "message", `Message from Dr. ${doctor.name}`, input.trim());
    setInput(""); loadMsgs();
  };

  const selContact = contacts.find(c => c.id === selId);

  return (
    <div className="dp-anim">
      <div className="dp-page-head"><div><h1 className="dp-title">Messages</h1></div></div>
      <div className="dp-msg-layout">
        <div className="dp-msg-contacts">
          {contacts.map(c => (
            <div key={c.id} className={`dp-msg-contact${selId===c.id?" active":""}`} onClick={() => setSelId(c.id)}>
              <Avatar name={c.name} size={36} src={c.avatar}/>
              <div style={{ flex:1, overflow:"hidden" }}>
                <div style={{ fontWeight:700, fontSize:13, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.name}</div>
                <div style={{ fontSize:11, color:"#94a3b8" }}>{c.role}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="dp-msg-chat">
          {selContact && <>
            <div style={{ padding:"12px 16px", borderBottom:"1px solid #e2e8f0", display:"flex", alignItems:"center", gap:10 }}>
              <Avatar name={selContact.name} size={36} src={selContact.avatar}/>
              <div style={{ fontWeight:700, fontSize:14 }}>{selContact.name}</div>
            </div>
            <div className="dp-chat-msgs">
              {msgs.length===0 && <div className="dp-empty"><p>No messages yet.</p></div>}
              {msgs.map(m => {
                const isMe = m.fromId === doctorId;
                return (
                  <div key={m.id} style={{ display:"flex", flexDirection:"column", alignItems:isMe?"flex-end":"flex-start", marginBottom:8 }}>
                    <div style={{ background:isMe?"#00bfa5":"#f1f5f9", color:isMe?"#fff":"#0f172a", borderRadius:14, padding:"9px 14px", maxWidth:"72%", fontSize:13 }}>
                      {m.body}
                    </div>
                  </div>
                );
              })}
              <div ref={endRef}/>
            </div>
            <div style={{ padding:"10px 14px", borderTop:"1px solid #e2e8f0", display:"flex", gap:8 }}>
              <input style={{ ...inp, flex:1 }} placeholder="Type a message..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && send()}/>
              <button className="dp-btn-primary" style={{ padding:"9px 16px" }} onClick={send}>Send</button>
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}

/* ===============================================================
   NOTIFICATIONS
================================================================ */
function DocNotifications({ doctorId }) {
  const [items, setItems] = useState([]);
  const refresh = () => {
    const all = notifDB.all().filter(n => n.toId===doctorId).reverse();
    setItems(all);
    all.filter(n => !n.read).forEach(n => notifDB.update(n.id, { read:true }));
  };
  useEffect(() => { refresh(); const t = setInterval(refresh, 3000); return () => clearInterval(t); }, [doctorId]);

  return (
    <div className="dp-anim">
      <div className="dp-page-head"><div><h1 className="dp-title">Notifications</h1></div></div>
      <div className="dp-card">
        {items.length===0 && <div className="dp-empty"><p>No notifications yet.</p></div>}
        {items.map(n => (
          <div key={n.id} style={{ display:"flex", gap:14, padding:"14px 0", borderBottom:"1px solid #e2e8f0" }}>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:14 }}>{n.title}</div>
              <div style={{ fontSize:13, color:"#64748b", marginTop:2 }}>{n.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===============================================================
   PROFILE - photo upload + full editable form
================================================================ */
function DocProfile({ doctorId, doctor, toast, refreshBadges }) {
  const [form, setForm] = useState({
    name: doctor.name || "", email: doctor.email || "", phone: doctor.phone || "",
    specialty: doctor.specialty || "", bio: doctor.bio || "", location: doctor.location || "",
    consultFee: doctor.consultFee || 0,
  });
  const [avatar, setAvatar] = useState(doctor.avatar || "");
  const [pw, setPw] = useState({ newPw:"", confirm:"" });
  const fileRef = useRef(null);

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2*1024*1024) { toast("Image must be under 2MB","error"); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      setAvatar(ev.target.result);
      doctorDB.update(doctorId, { avatar: ev.target.result });
      toast("Profile photo updated!");
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    doctorDB.update(doctorId, { ...form, avatar });
    pushNotif("admin", "doctor", "Doctor Profile Updated", `${form.name} updated their profile.`);
    toast("Profile saved!");
  };

  const changePw = () => {
    if (pw.newPw !== pw.confirm) { toast("Passwords don't match","error"); return; }
    if (pw.newPw.length < 6) { toast("Min 6 characters","error"); return; }
    doctorDB.update(doctorId, { password: pw.newPw });
    setPw({ newPw:"", confirm:"" });
    toast("Password changed!");
  };

  return (
    <div className="dp-anim">
      <div className="dp-page-head"><div><h1 className="dp-title">My Profile</h1></div></div>
      <div className="dp-two-col">
        <div className="dp-card" style={{ textAlign:"center" }}>
          <div style={{ position:"relative", width:90, height:90, margin:"0 auto 14px" }}>
            {avatar
              ? <img src={avatar} alt="" style={{ width:90, height:90, borderRadius:"50%", objectFit:"cover", border:"3px solid #e2e8f0" }}/>
              : <Avatar name={doctor.name} size={90}/>}
            <button onClick={() => fileRef.current?.click()} style={{ position:"absolute", bottom:0, right:0, width:28, height:28, borderRadius:"50%", background:"#1e88e5", color:"#fff", border:"2px solid #fff", cursor:"pointer", fontSize:11 }}>Edit</button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handlePhoto}/>
          </div>
          <div style={{ fontWeight:700, fontSize:18 }}>{doctor.name}</div>
          <div style={{ fontSize:13, color:"#64748b" }}>{doctor.specialty}</div>
        </div>

        <div>
          <div className="dp-card">
            <FRow label="Full Name"><input style={inp} value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))}/></FRow>
            <FRow label="Email"><input style={inp} value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))}/></FRow>
            <FRow label="Phone"><input style={inp} value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))}/></FRow>
            <FRow label="Specialty"><input style={inp} value={form.specialty} onChange={e => setForm(f=>({...f,specialty:e.target.value}))}/></FRow>
            <FRow label="Location"><input style={inp} value={form.location} onChange={e => setForm(f=>({...f,location:e.target.value}))}/></FRow>
            <FRow label="Consultation Fee (XAF)"><input style={inp} type="number" value={form.consultFee} onChange={e => setForm(f=>({...f,consultFee:Number(e.target.value)}))}/></FRow>
            <FRow label="Bio"><textarea style={{...inp,height:80,resize:"vertical"}} value={form.bio} onChange={e => setForm(f=>({...f,bio:e.target.value}))}/></FRow>
            <button className="dp-btn-primary" style={{ width:"100%" }} onClick={save}>Save Changes</button>
          </div>

          <div className="dp-card" style={{ marginTop:16 }}>
            <FRow label="New Password"><input style={inp} type="password" value={pw.newPw} onChange={e => setPw(p=>({...p,newPw:e.target.value}))}/></FRow>
            <FRow label="Confirm New Password"><input style={inp} type="password" value={pw.confirm} onChange={e => setPw(p=>({...p,confirm:e.target.value}))}/></FRow>
            <button className="dp-btn-primary" style={{ width:"100%" }} onClick={changePw}>Update Password</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===============================================================
   CSS
================================================================ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
:root{--sw:252px}
*{box-sizing:border-box;margin:0;padding:0}

.dp-sidebar{width:var(--sw);background:linear-gradient(180deg,#061529,#0d2347);display:flex;flex-direction:column;height:100vh;flex-shrink:0;overflow-y:auto;transition:transform .28s;position:relative;z-index:200}
.dp-brand{display:flex;align-items:center;gap:12px;padding:22px 18px 16px;border-bottom:1px solid rgba(255,255,255,.08);flex-shrink:0}
.dp-brand-orb{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#00bfa5,#0891b2);display:flex;align-items:center;justify-content:center;font-size:20px;color:#fff;font-weight:800}
.dp-nav{flex:1;padding:8px 0;overflow-y:auto}
.dp-nav-section{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.3);padding:12px 20px 5px}
.dp-nav-item{display:flex;align-items:center;gap:10px;width:100%;padding:9px 20px;background:none;border:none;cursor:pointer;color:rgba(255,255,255,.65);font-size:13.5px;font-family:inherit;text-align:left;transition:background .2s,color .2s}
.dp-nav-item:hover{background:rgba(255,255,255,.06);color:#fff}
.dp-nav-item.active{background:rgba(0,191,165,.2);color:#fff;border-right:3px solid #00bfa5}
.dp-nav-icon{font-size:11px;font-weight:700;width:28px;text-align:center;background:rgba(255,255,255,.08);border-radius:6px;padding:2px 0}
.dp-nav-badge{margin-left:auto;background:#f44336;color:#fff;border-radius:99px;font-size:10px;font-weight:700;padding:1px 6px}
.dp-logout{width:100%;padding:15px 20px;background:none;border:none;cursor:pointer;color:rgba(255,255,255,.5);font-size:13.5px;font-family:inherit;border-top:1px solid rgba(255,255,255,.08);text-align:left}
.dp-logout:hover{background:rgba(239,68,68,.15);color:#ff6b6b}

.dp-main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.dp-topbar{height:58px;background:#fff;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;gap:8px;padding:0 20px;flex-shrink:0}
.dp-hamburger{display:none;background:none;border:none;cursor:pointer;font-size:14px}
.dp-topbar-icon{position:relative;background:#f0f4f9;border:1px solid #e2e8f0;border-radius:8px;padding:6px 10px;cursor:pointer;font-size:11px;font-weight:700}
.dp-top-badge{position:absolute;top:-4px;right:-4px;background:#f44336;color:#fff;border-radius:99px;font-size:9px;font-weight:800;padding:1px 4px}
.dp-content{flex:1;overflow-y:auto;padding:24px}

.dp-anim{animation:dpFadeUp .35s ease}
@keyframes dpFadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}

.dp-page-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:24px;flex-wrap:wrap}
.dp-title{font-family:'Sora',sans-serif;font-weight:800;font-size:26px}
.dp-sub{font-size:13px;color:#64748b;margin-top:3px}

.dp-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
.dp-stat-card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:18px;border-left:4px solid var(--acc,#1e88e5)}

.dp-card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:20px}
.dp-card-head{margin-bottom:14px}
.dp-card-title{font-family:'Sora',sans-serif;font-weight:700;font-size:15px}
.dp-two-col{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.dp-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #e2e8f0}
.dp-row:last-child{border-bottom:none}

.dp-tbl-wrap{overflow-x:auto;margin-top:10px}
.dp-table{width:100%;border-collapse:collapse;font-size:13.5px}
.dp-table th{text-align:left;padding:10px 12px;border-bottom:2px solid #e2e8f0;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase}
.dp-table td{padding:12px;border-bottom:1px solid #e2e8f0}

.dp-btn-primary{background:linear-gradient(135deg,#1e88e5,#42a5f5);color:#fff;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
.dp-ghost{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;color:#0f172a;font-family:inherit}
.dp-filter-tabs{display:flex;gap:4px;margin-bottom:8px}
.dp-filter-tab{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:13px;font-weight:600;cursor:pointer;color:#64748b;font-family:inherit}
.dp-filter-tab.active{background:#1e88e5;color:#fff;border-color:#1e88e5}

.dp-msg-layout{display:grid;grid-template-columns:240px 1fr;gap:16px;height:540px}
.dp-msg-contacts{background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow-y:auto}
.dp-msg-contact{display:flex;align-items:center;gap:10px;padding:12px 14px;cursor:pointer;border-bottom:1px solid #e2e8f0}
.dp-msg-contact:hover{background:#f8fafc}
.dp-msg-contact.active{background:rgba(30,136,229,.06);border-left:3px solid #1e88e5}
.dp-msg-chat{background:#fff;border:1px solid #e2e8f0;border-radius:16px;display:flex;flex-direction:column;overflow:hidden}
.dp-chat-msgs{flex:1;overflow-y:auto;padding:14px}

.dp-empty{text-align:center;padding:40px;color:#94a3b8}
.dp-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100}

@media(max-width:960px){
  .dp-stats{grid-template-columns:1fr 1fr}
  .dp-two-col{grid-template-columns:1fr}
  .dp-msg-layout{grid-template-columns:1fr;height:auto}
}
@media(max-width:640px){
  .dp-sidebar{position:fixed;left:0;top:0;transform:translateX(-100%);height:100vh;z-index:300}
  .dp-sidebar.open{transform:translateX(0)}
  .dp-overlay{display:block}
  .dp-hamburger{display:flex!important}
  .dp-stats{grid-template-columns:1fr}
  .dp-content{padding:14px}
}
`;
