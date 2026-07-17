import AIAssistant from '../../Components/AIAssistant';
// PatientPanel.jsx - API backed implementation
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../services/api';
import '../Styles/patient.css';
import JitsiVideoCall from "../../Components/JitsiVideoCall";
import AiScanner from "../../Components/AiScanner";
import DentalChart from "../../Components/DentalChart";
import RecoveryMonitor from "../../Components/RecoveryMonitor";
import HygieneTracker from "../../Components/HygieneTracker";
import MembershipPlans from "../../Components/MembershipPlans";

const uid = () => Math.random().toString(36).slice(2, 10);

/** Custom hook to fetch all patient-related data from API */
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
    homeVisits,
    payments,
    messages,
    notifications,
    dentalRecords,
    records,
    loading,
    refresh,
  } = usePatientData(patientId);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener('stech_refresh', handler);
    return () => window.removeEventListener('stech_refresh', handler);
  }, [refresh]);

  useEffect(() => {
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [refresh]);

  const unreadCount = notifications.filter(n => n.toId === patientId && !n.read).length;
  const unreadMsg = messages.filter(m => m.toId === patientId && !m.read).length;

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("stech_session");
      navigate("/login");
    }
  };

  if (!patient && !loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans',sans-serif", flexDirection: 'column', gap: 16, color: '#64748b' }}>
        <div style={{ fontSize: 52 }}>🦷</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif" }}>Patient not found</h2>
        <p>ID: {patientId || "undefined"} — please log in again.</p>
        <button className="pp-btn pp-btn-primary" onClick={handleLogout}>Back to Login</button>
      </div>
    );
  }

  const combinedConsultations = [...(consultations || []), ...(appointments || []).filter(a => a.isVideoConsultation || a.healthType === "Video Consultation")];
  const combinedHomeVisits = [...(homeVisits || []), ...(appointments || []).filter(a => a.isHomeVisit || a.healthType === "Home Visit")];

  const sp = { patient, patientId, showToast, refresh, setTab, onJoinCall: (id) => {
    const finalRoom = id.startsWith("Stech-Consultation-") ? id : "Stech-Consultation-" + id;
    setActiveVideoCall(finalRoom);
  }};

  return (
    <div className="pp-root">
      {/* ── SIDEBAR ── */}
      <aside className={`pp-sidebar ${sideOpen ? 'pp-sidebar--open' : ''}`}>
        <div className="pp-sidebar-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div className="pp-brand-mark"><i className="ti ti-tooth"/></div>
            <div>
              <div className="pp-brand-name">ToothEase</div>
              <div className="pp-brand-sub">Patient Portal</div>
            </div>
          </div>
          <button className="pp-sidebar-x" onClick={() => setSide(false)}><i className="ti ti-x"/></button>
        </div>
        {/* Patient mini‑card */}
        <div className="pp-sidebar-card">
          <Avatar name={patient?.name} size={42} />
          <div className="pp-sidebar-info">
            <strong>{patient?.name}</strong>
            <span>{patient?.forfait} Plan</span>
            {patient?.membership && <span className="pp-member-chip">⭐ Member</span>}
          </div>
        </div>
        {/* Navigation */}
        <nav className="pp-nav">
          {NAV.map((n, i) =>
            n.section ? (
              <div key={i} className="pp-nav-section">{n.section}</div>
            ) : (
              <button
                key={n.key}
                className={`pp-nav-item ${tab === n.key ? 'active' : ''}`}
                onClick={() => { setTab(n.key); setSide(false); }}
              >
                <i className={`ti ${n.icon}`} />
                <span>{n.label}</span>
                {n.key === 'notifications' && unreadCount > 0 && <span className="pp-nav-dot">{unreadCount}</span>}
                {n.key === 'messages' && unreadMsg > 0 && <span className="pp-nav-dot">{unreadMsg}</span>}
              </button>
            )
          )}
        </nav>
        {/* Footer */}
        <div className="pp-sidebar-foot">
          <Avatar name={patient?.name} size={32} />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{patient?.name}</div>
            <div style={{ fontSize: 11, opacity: .65 }}>Patient</div>
          </div>
          <button className="pp-logout-btn" onClick={handleLogout} title="Log out"><i className="ti ti-logout"/></button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="pp-main">
        {/* Topbar */}
        <header className="pp-topbar">
          <button className="pp-hamburger" onClick={() => setSide(true)}><i className="ti ti-menu-2"/></button>
          <div className="pp-topbar-title">{NAV.find(n => n.key === tab)?.label || 'Dashboard'}</div>
          <div className="pp-topbar-right">
              {membershipPlan !== 'Gold Premium' && (
                <button 
                  onClick={() => setTab('membership')} 
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 99, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(245,158,11,0.3)', marginRight: 10 }}
                >
                  <i className="ti ti-crown" /> Upgrade to VIP
                </button>
              )}
            <button className="pp-icon-btn" onClick={() => setTab('messages')} title="Messages"><i className="ti ti-message-circle"/>{unreadMsg > 0 && <span className="pp-notif-dot">{unreadMsg}</span>}</button>
            <button className="pp-icon-btn" onClick={() => setTab('notifications')} title="Notifications"><i className="ti ti-bell"/>{unreadCount > 0 && <span className="pp-notif-dot">{unreadCount}</span>}</button>
            <div className="pp-topbar-profile" onClick={() => setTab('profile')}>
              <Avatar name={patient?.name} size={30} />
              <span>{patient?.name?.split(' ')[0]}</span>
            </div>
            <button className="pp-logout-pill" onClick={handleLogout}><i className="ti ti-logout"/> Logout</button>
          </div>
        </header>
        {/* Content */}
        <main className="pp-content">
          {tab === 'overview' && <PatOverview {...sp} appointments={appointments} consultations={combinedConsultations} prescriptions={prescriptions} payments={payments} doctors={doctors} />}
          {tab === 'my_chart' && <PatMyChart {...sp} dentalRecords={dentalRecords} />}
          {tab === 'ai_scan' && <AiScanner onBookRecommendation={() => setTab("book")} />}
          {tab === 'recovery' && <RecoveryMonitor />}
          {tab === 'appointments' && <PatAppointments {...sp} items={appointments} refresh={refresh} showToast={showToast} />}
          {tab === 'book' && <PatBooking {...sp} patient={patient} doctors={doctors} />}
          {tab === 'consultations' && <PatConsultations {...sp} consultations={combinedConsultations} />}
          {tab === 'home_visit' && <PatHomeVisit {...sp} homeVisits={combinedHomeVisits} refresh={refresh} showToast={showToast} />}
          {tab === 'prescriptions' && <PatPrescriptions {...sp} prescriptions={prescriptions} refresh={refresh} />}
          {tab === 'records' && <PatRecords {...sp} records={records} />}
          {tab === 'hygiene' && <HygieneTracker />}
          {tab === 'membership' && <MembershipPlans currentPlan={membershipPlan} onPlanUpdate={setMembershipPlan} />}
          {tab === 'payments' && <PatPayments {...sp} payments={payments} />}
          {tab === 'messages' && <PatMessages {...sp} messages={messages} />}
          {tab === 'notifications' && <PatNotifications {...sp} notifications={notifications} />}
          {tab === 'profile' && <PatProfile {...sp} patient={patient} />}
        </main>
      </div>

      {/* Mobile overlay */}
      {sideOpen && <div className="pp-overlay" onClick={() => setSide(false)} />}

      {/* Jitsi Video Call Overlay */}
      {activeVideoCall && <JitsiVideoCall roomName={activeVideoCall} displayName={patient?.name || "Patient"} onEndCall={() => setActiveVideoCall(null)} />}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <AIAssistant />
    </div>
  );
}

/* ── SHARED UI COMPONENTS (unchanged) ── */
const AVATAR_COLORS = ["#1e88e5","#00bfa5","#7c3aed","#f44336","#ff7043","#0891b2","#16a34a","#be185d"]; 
function Avatar({ name = "?", size = 36 }) {
  const initials = name.split(" ").map(n => n[0]).join('').toUpperCase().slice(0,2);
  const color = AVATAR_COLORS[(name.charCodeAt(0)||0) % AVATAR_COLORS.length];
  return (<div className="pp-avatar" style={{ width: size, height: size, background: color, fontSize: size * .37, flexShrink: 0 }}>{initials}</div>);
}
function Badge({ status }) {
  const MAP = { confirmed:"pp-b-green", active:"pp-b-green", paid:"pp-b-green", completed:"pp-b-green", online:"pp-b-green", accepted:"pp-b-green", pending:"pp-b-amber", scheduled:"pp-b-amber", inactive:"pp-b-gray", cancelled:"pp-b-red", busy:"pp-b-red", declined:"pp-b-red", premium:"pp-b-purple", standard:"pp-b-blue", basic:"pp-b-gray", video:"pp-b-purple", physical:"pp-b-blue", chat:"pp-b-teal" };
  return <span className={`pp-badge ${MAP[status?.toLowerCase()] || "pp-b-gray"}`}>{status}</span>;
}
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`pp-toast pp-toast--${type}`}>
      <span className="pp-toast-icon">{type === "success" ? "✓" : type === "error" ? "✕" : "ℹ"}</span>
      {msg}
      <button className="pp-toast-close" onClick={onClose}>✕</button>
    </div>
  );
}
function Modal({ title, subtitle, onClose, children, width = 520 }) {
  useEffect(() => { const h = e => e.key === "Escape" && onClose(); window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [onClose]);
  return (
    <div className="pp-modal-overlay" onClick={onClose}>
      <div className="pp-modal" style={{ maxWidth: width }} onClick={e => e.stopPropagation()}>
        <div className="pp-modal-hd">
          <div>
            <div className="pp-modal-title">{title}</div>
            {subtitle && <div className="pp-modal-sub">{subtitle}</div>}
          </div>
          <button className="pp-modal-close" onClick={onClose}><i className="ti ti-x"/></button>
        </div>
        <div className="pp-modal-bd">{children}</div>
      </div>
    </div>
  );
}
function ConfirmDialog({ msg, onConfirm, onCancel }) {
  return (
    <div className="pp-modal-overlay" onClick={onCancel}>
      <div className="pp-modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
        <div className="pp-modal-hd"><div className="pp-modal-title">⚠ Confirm</div></div>
        <div className="pp-modal-bd">
          <p style={{ color: "var(--pp-muted)", marginBottom: 24, lineHeight: 1.7 }}>{msg}</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="pp-btn pp-btn-ghost" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
            <button className="pp-btn pp-btn-danger" style={{ flex: 1 }} onClick={onConfirm}>Confirm</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── NAV definition ── */
const NAV = [
  { section: "Overview" },
  { key: "overview", icon: "ti-layout-dashboard", label: "Dashboard" },
  { section: "Intelligent Triage" },
  { key: "ai_scan", icon: "ti-brain", label: "AI Scanner" },
  { key: "recovery", icon: "ti-heartbeat", label: "Recovery Monitor" },
  { section: "Services" },
  { key: "appointments", icon: "ti-calendar-check", label: "My Appointments" },
  { key: "book", icon: "ti-calendar-plus", label: "Book Appointment" },
  { key: "consultations", icon: "ti-video", label: "Consultations" },
  { key: "home_visit", icon: "ti-home-heart", label: "Home Service" },
  { section: "Health" },
  { key: "my_chart", icon: "ti-dental", label: "My 3D Chart" },
  { key: "prescriptions", icon: "ti-pill", label: "Prescriptions" },
  { key: "records", icon: "ti-clipboard-heart", label: "Medical Records" },
  { key: "hygiene", icon: "ti-trophy", label: "Habits & Rewards" },
  { section: "Account" },
  { key: "payments", icon: "ti-credit-card", label: "Payments" },
  { key: "messages", icon: "ti-message-circle", label: "Messages" },
  { key: "notifications", icon: "ti-bell", label: "Notifications" },
  { key: "profile", icon: "ti-user-circle", label: "My Profile" },
];

/* ── PAGE COMPONENTS – simplified to use props ── */
function PatOverview({ patient, doctors = [], appointments, consultations, prescriptions, payments, setTab }) {
  const upcoming = appointments.filter(a => a.status !== "cancelled").sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time));
  return (
    <div className="pp-animate">
      <div className="pp-welcome-bar">
        <div className="pp-welcome-text">
          <h1>Good {new Date().getHours()<12?"morning":new Date().getHours()<18?"afternoon":"evening"}, <em>{patient?.name?.split(' ')[0]}</em>!</h1>
          <p>{new Date().toDateString()} · Your dental health, all in one place.</p>
        </div>
        <button className="pp-btn pp-btn-white" onClick={() => setTab('book')}> <i className="ti ti-calendar-plus"/> Book Appointment</button>
      </div>
      {/* Stats grid */}
      <div className="pp-stats-grid">
        {[{icon:"ti-calendar-check",label:"Appointments",value:appointments.length, bg:"#dbeafe",c:"#1e88e5", nav:"appointments"},
          {icon:"ti-video",label:"Consultations",value:consultations.length, bg:"#ede9fe",c:"#7c3aed", nav:"consultations"},
          {icon:"ti-pill",label:"Prescriptions",value:prescriptions.length, bg:"#dcfce7",c:"#16a34a", nav:"prescriptions"},
          {icon:"ti-credit-card",label:"Payments",value:payments.length, bg:"#fef3c7",c:"#d97706", nav:"payments"}]
          .map(s => (
            <div key={s.label} className="pp-stat-card" onClick={() => setTab(s.nav)}>
              <div className="pp-stat-icon" style={{background:s.bg, color:s.c}}><i className={`ti ${s.icon}`}/></div>
              <div>
                <div className="pp-stat-label">{s.label}</div>
                <div className="pp-stat-value">{s.value}</div>
              </div>
              <i className="ti ti-chevron-right pp-stat-chevron"/>
            </div>
          ))}
      </div>
      {/* Upcoming appointments preview */}
      <div className="pp-two-col">
        <div className="pp-card">
          <div className="pp-card-hd">
            <div><div className="pp-card-title">Upcoming Appointments</div></div>
            <button className="pp-ghost-btn" onClick={() => setTab('appointments')}>View all →</button>
          </div>
          {upcoming.length === 0 ? (
            <div className="pp-empty"><i className="ti ti-calendar-off" style={{fontSize:36,color:"var(--pp-border)"}}/>
              <p>No upcoming appointments</p>
              <button className="pp-btn pp-btn-primary pp-btn-sm" onClick={() => setTab('book')}>Book one now</button>
            </div>
          ) : upcoming.slice(0,4).map(a => {
            const dateStr = a.date ? new Date(a.date).toISOString().split('T')[0] : '';
            return (
            <div key={a._id || a.id} className="pp-appt-row">
              <div className="pp-appt-date-box">
                <span className="pp-appt-day">{dateStr.split('-')[2]}</span>
                <span className="pp-appt-mon">{new Date(dateStr).toLocaleString('default',{month:'short'})}</span>
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:14}}>{a.healthType}</div>
                <div style={{fontSize:12,color:"var(--pp-muted)",marginTop:2}}>Dr. {a.doctorId?.userId?.name || a.doctorName || 'Unknown'} · {a.time}</div>
              </div>
              <Badge status={a.status}/>
            </div>
          )})}
        </div>
        <div className="pp-card">
          <div className="pp-card-hd">
            <div><div className="pp-card-title">Available Doctors</div></div>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap: 12, marginTop: 12}}>
             {doctors.slice(0,4).map(d => (
               <div key={d._id} style={{display:'flex', alignItems:'center', gap: 12}}>
                 <Avatar name={d.userId?.name || d.name} size={36} />
                 <div>
                   <div style={{fontWeight:600}}>Dr. {d.userId?.name || d.name}</div>
                   <div style={{fontSize:12, color:'var(--pp-muted)'}}>{d.specialty}</div>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PatAppointments({ items, setTab, onJoinCall, refresh, showToast }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = items.filter(a => (
    (filter === 'all' || a.status?.toLowerCase() === filter.toLowerCase()) &&
    [a.healthType, a.doctorName].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  ));

  const handleUpdate = async (id, status) => {
    try {
      await API.patch(`/appointments/${id}/status`, { status });
      if (showToast) showToast(`Appointment ${status.toLowerCase()}`, "success");
      if (refresh) refresh();
    } catch (e) {
      if (showToast) showToast("Failed to update", "error");
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await API.patch(`/appointments/${id}/status`, { status: "CANCELLED" });
      if (showToast) showToast("Appointment cancelled", "success");
      if (refresh) refresh();
    } catch (e) {
      if (showToast) showToast("Failed to cancel", "error");
    }
  };

  return (
    <div className="pp-animate">
      <div className="pp-page-hd">
        <div><h1 className="pp-page-title">My Appointments</h1><p className="pp-page-sub">{items.length} total</p></div>
        <button className="pp-btn pp-btn-primary" onClick={() => setTab('book')}>+ Book New</button>
      </div>
      <div className="pp-filter-bar">
        <div className="pp-search-wrap"><i className="ti ti-search"/><input className="pp-search" placeholder="Search treatment, doctor…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <div className="pp-filter-tabs">
          {['all','pending','confirmed','cancelled'].map(f => (
            <button key={f} className={`pp-filter-tab ${filter===f?'active':''}`} onClick={()=>setFilter(f)}>
              {f.charAt(0).toUpperCase()+f.slice(1)} <span className="pp-filter-count">{f==='all'?items.length:items.filter(a=>a.status===f).length}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {filtered.length===0 && (
          <div className="pp-card"><div className="pp-empty"><i className="ti ti-calendar-off" style={{fontSize:36}}/>
            <p>No appointments found.</p>
            <button className="pp-btn pp-btn-primary pp-btn-sm" onClick={()=>setTab('book')}>Book Now</button>
          </div></div>
        )}
        {filtered.map(a => {
          const isVideo = a.isVideoConsultation || a.type === 'video';
          const isHome = a.isHomeVisit || a.type === 'home';
          const typeIcon = isVideo ? 'ti-video' : isHome ? 'ti-home-heart' : 'ti-building-hospital';
          const typeColor = isVideo ? '#7c3aed' : isHome ? '#eab308' : '#1e88e5';
          const typeBg = isVideo ? '#ede9fe' : isHome ? '#fef08a' : '#dbeafe';
          const dateStr = a.date ? new Date(a.date).toISOString().split('T')[0] : '';
          const docName = a.doctorId?.userId?.name || a.doctorName || 'Unknown Doctor';

          return (
          <div key={a._id || a.id} className="pp-card pp-appt-card" style={{ borderLeft: `4px solid ${typeColor}` }}>
            <div className="pp-appt-card-left">
              <div className="pp-appt-date-box pp-appt-date-box--lg" style={{ background: typeBg, color: typeColor }}>
                <span className="pp-appt-day">{dateStr.split('-')[2]}</span>
                <span className="pp-appt-mon">{new Date(dateStr).toLocaleString('default',{month:'short'})}</span>
              </div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:17}}>
                  <i className={`ti ${typeIcon}`} style={{marginRight: 6, color: typeColor}}/>
                  {a.healthType}
                </div>
                <div style={{fontSize:13,color:"var(--pp-muted)",marginTop:4}}>Dr. {docName} · {a.time}</div>
                {a.notes && <div style={{fontSize:12,color:"var(--pp-muted)",marginTop:4,fontStyle:"italic"}}>{`"${a.notes}"`}</div>}
                {a.visitAddress && <div style={{fontSize:12,color:"var(--pp-muted)",marginTop:4}}>📍 {a.visitAddress}</div>}
                <div style={{marginTop:8,fontSize:13,fontWeight:700,color:"var(--pp-blue)"}}>{Number(a.amount).toLocaleString('fr-CM')} XAF</div>
              </div>
            </div>
            <div className="pp-appt-card-right">
              <Badge status={a.status}/>
              <div style={{display:'flex',gap:6,marginTop:8}}>
                {a.status === 'PENDING' && <div style={{display:"inline-flex", gap:6, marginRight:10}}>
                  <button className="pp-btn" style={{background:"#e6f4ea",color:"#137333",padding:"6px 12px",fontSize:13}} onClick={()=>handleUpdate(a._id||a.id, "CONFIRMED")}>Accept</button>
                  <button className="pp-btn" style={{background:"#fce8e6",color:"#c5221f",padding:"6px 12px",fontSize:13}} onClick={()=>handleUpdate(a._id||a.id, "CANCELLED")}>Reject</button>
                </div>}
                {isVideo && ['scheduled','confirmed','CONFIRMED','accepted','APPROVED'].includes(a.status) && <button onClick={() => onJoinCall(a.roomId || a._id || a.id)} className="pp-btn pp-btn-primary pp-btn-sm" style={{textDecoration:'none', border: 'none', cursor: 'pointer'}}><i className="ti ti-video"/> Join Call</button>}
                {isHome && (a.status==='scheduled' || a.status==='confirmed' || a.status==='pending' || a.status==='PENDING' || a.status==='accepted') && <a href={`/livemap?visit=${a.trackingId || a._id}`} className="pp-btn pp-btn-primary pp-btn-sm" style={{textDecoration:'none', background:'#eab308', border:'none'}}><i className="ti ti-map-pin"/> Track Visit</a>}
                {!isVideo && !isHome && <button className="pp-ghost-btn" onClick={() => window.location.href = `/livemap?visit=${a.trackingId || a._id}`}><i className="ti ti-eye"/> View</button>}
                {a.status!=='CANCELLED' && a.status!=='cancelled' && a.status!=='COMPLETED' && a.status!=='completed' && <button className="pp-ghost-btn pp-danger-text" onClick={() => handleCancel(a._id || a.id)}><i className="ti ti-x"/> Cancel</button>}
              </div>
            </div>
          </div>
        )})}
      </div>
    </div>
  );
}

function PatBooking({ patient, doctors, setTab, showToast, refresh }) {
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [form, setForm] = useState({
    type: 'Clinic Visit', doctorId: '', date: '', time: '', notes: '', visitAddress: ''
  });
  
  // Payment Form States
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileName, setMobileName] = useState('');

  const [loading, setLoading] = useState(false);

  const handleSimulatePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate payment processing delay
    await new Promise(r => setTimeout(r, 1500));
    await handleSubmit();
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        doctorId: form.doctorId,
        healthType: form.notes || 'General Checkup',
        date: form.date,
        time: form.time,
        notes: form.type,
        isHomeVisit: form.type === 'Home Visit',
        isVideoConsultation: form.type === 'Video Consultation',
        visitAddress: form.visitAddress,
        roomId: form.type === 'Video Consultation' ? uid() : '',
        trackingId: form.type === 'Home Visit' ? uid() : '',
      };
      const { data } = await API.post("/appointments", payload);
      if (data?.success) {
        showToast("Booking & Payment successful!", "success");
        refresh();
        setTab("appointments");
      }
    } catch (e) {
      showToast(e.response?.data?.message || "Booking failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const selectedDoctor = doctors.find(d => (d._id || d.id) === form.doctorId);
  const fee = selectedDoctor ? selectedDoctor.consultFee : 15000;

  return (
    <div className="pp-animate" style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="pp-page-hd" style={{ marginBottom: 24 }}>
        <div><h1 className="pp-page-title">Book an Appointment</h1><p className="pp-page-sub">Step {step} of 4</p></div>
      </div>
      
      <div className="pp-card" style={{ padding: 32 }}>
        {step === 1 && (
          <div className="pp-animate">
            <h3 style={{ marginBottom: 16 }}>Select Service Type</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['Clinic Visit', 'Video Consultation', 'Home Visit'].map(t => (
                <button key={t} className={`pp-btn ${form.type === t ? 'pp-btn-primary' : 'pp-ghost-btn'}`} 
                  style={{ justifyContent: 'flex-start', padding: 16, border: form.type===t?'none':'1px solid var(--pp-border)' }} 
                  onClick={() => setForm({ ...form, type: t })}>
                  <i className={`ti ${t==='Clinic Visit'?'ti-building-hospital':t==='Video Consultation'?'ti-video':'ti-home-heart'}`} style={{fontSize:24, marginRight:16}}/>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600 }}>{t}</div>
                    <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                      {t==='Clinic Visit' ? 'Visit our clinic in person' : t==='Video Consultation' ? 'Talk to a doctor online' : 'A doctor visits your home'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="pp-btn pp-btn-primary" onClick={() => setStep(2)}>Next Step →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="pp-animate">
            <h3 style={{ marginBottom: 16 }}>Select a Doctor</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxHeight: 400, overflowY: 'auto' }}>
              {doctors.map(d => (
                <div key={d._id || d.id} className={`pp-card ${form.doctorId === (d._id || d.id) ? 'pp-card-selected' : ''}`} 
                  style={{ cursor: 'pointer', padding: 16, border: form.doctorId===(d._id || d.id)?'2px solid var(--pp-blue)':'1px solid var(--pp-border)' }} 
                  onClick={() => setForm({ ...form, doctorId: d._id || d.id })}>
                  <div style={{ fontWeight: 600 }}>Dr. {d.userId?.name || d.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--pp-muted)' }}>{d.specialty}</div>
                  <div style={{ fontSize: 13, marginTop: 8, fontWeight: 600, color: 'var(--pp-blue)' }}>{d.consultFee} XAF</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <button className="pp-ghost-btn" onClick={() => setStep(1)}>← Back</button>
              <button className="pp-btn pp-btn-primary" disabled={!form.doctorId} onClick={() => setStep(3)}>Next Step →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="pp-animate">
            <h3 style={{ marginBottom: 16 }}>Date & Time</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="pp-label">Date</label>
                <input type="date" className="pp-input" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
              </div>
              <div>
                <label className="pp-label">Time</label>
                <input type="time" className="pp-input" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
              </div>
              <div>
                <label className="pp-label">Reason for visit</label>
                <input type="text" className="pp-input" placeholder="e.g. Toothache, Routine Checkup" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              {form.type === 'Home Visit' && (
                <div>
                  <label className="pp-label">Home Address</label>
                  <input type="text" className="pp-input" placeholder="Enter your full address" value={form.visitAddress} onChange={e => setForm({...form, visitAddress: e.target.value})} />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <button className="pp-ghost-btn" onClick={() => setStep(2)}>← Back</button>
              <button className="pp-btn pp-btn-primary" disabled={!form.date || !form.time || !form.notes || (form.type==='Home Visit'&&!form.visitAddress)} onClick={() => setStep(4)}>
                Proceed to Payment →
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <form className="pp-animate" onSubmit={handleSimulatePayment}>
            <h3 style={{ marginBottom: 16 }}>Payment Required</h3>
            
            <div style={{ padding: 16, background: 'var(--pp-bg)', borderRadius: 8, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>{form.type} Fee</span>
                <strong>{fee} XAF</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--pp-muted)', fontSize: 12 }}>
                <span>Taxes & Fees</span>
                <span>Included</span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--pp-border)', margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--pp-blue)' }}>
                <span>Total</span>
                <span>{fee} XAF</span>
              </div>
            </div>

            <h4 style={{ marginBottom: 12, fontSize: 14 }}>Select Payment Method</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              
              <div className={`pp-card ${paymentMethod === 'stripe' ? 'pp-card-selected' : ''}`} 
                style={{ cursor: 'pointer', padding: 16, border: paymentMethod==='stripe'?'2px solid var(--pp-blue)':'1px solid var(--pp-border)' }} 
                onClick={() => setPaymentMethod('stripe')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                    <i className="ti ti-credit-card" style={{ fontSize: 24 }}/>
                  </div>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>Credit / Debit Card</div>
                    <div style={{ fontSize: 12, color: 'var(--pp-muted)' }}>Powered by Stripe</div>
                  </div>
                  {paymentMethod === 'stripe' && <i className="ti ti-circle-check" style={{ fontSize: 20, color: 'var(--pp-blue)' }}/>}
                </div>
                
                {paymentMethod === 'stripe' && (
                  <div className="pp-animate" style={{ marginTop: 20 }}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--pp-text)', marginBottom: 6 }}>Card Information</label>
                      <div style={{ border: '1px solid var(--pp-border)', borderRadius: 8, overflow: 'hidden' }}>
                        <input type="text" placeholder="Card number" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} required
                          style={{ width: '100%', padding: '12px 16px', border: 'none', borderBottom: '1px solid var(--pp-border)', fontSize: 15, outline: 'none', background: 'transparent' }} />
                        <div style={{ display: 'flex' }}>
                          <input type="text" placeholder="MM / YY" value={expiry} onChange={(e) => setExpiry(e.target.value)} required
                            style={{ flex: 1, padding: '12px 16px', border: 'none', borderRight: '1px solid var(--pp-border)', fontSize: 15, outline: 'none', background: 'transparent' }} />
                          <input type="text" placeholder="CVC" value={cvc} onChange={(e) => setCvc(e.target.value)} required
                            style={{ flex: 1, padding: '12px 16px', border: 'none', fontSize: 15, outline: 'none', background: 'transparent' }} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--pp-text)', marginBottom: 6 }}>Name on card</label>
                      <input type="text" placeholder="John Doe" value={cardName} onChange={(e) => setCardName(e.target.value)} required
                        style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--pp-border)', borderRadius: 8, fontSize: 15, outline: 'none', background: 'transparent' }} />
                    </div>
                  </div>
                )}
              </div>

              <div className={`pp-card ${paymentMethod === 'mobile' ? 'pp-card-selected' : ''}`} 
                style={{ cursor: 'pointer', padding: 16, border: paymentMethod==='mobile'?'2px solid var(--pp-blue)':'1px solid var(--pp-border)' }} 
                onClick={() => setPaymentMethod('mobile')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                    <i className="ti ti-device-mobile" style={{ fontSize: 24 }}/>
                  </div>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>Mobile Money</div>
                    <div style={{ fontSize: 12, color: 'var(--pp-muted)' }}>MTN / Orange Money</div>
                  </div>
                  {paymentMethod === 'mobile' && <i className="ti ti-circle-check" style={{ fontSize: 20, color: 'var(--pp-blue)' }}/>}
                </div>

                {paymentMethod === 'mobile' && (
                  <div className="pp-animate" style={{ marginTop: 20 }}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--pp-text)', marginBottom: 6 }}>Phone Number</label>
                      <input type="tel" placeholder="e.g. 670 123 456" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} required
                        style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--pp-border)', borderRadius: 8, fontSize: 15, outline: 'none', background: 'transparent' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--pp-text)', marginBottom: 6 }}>Account Holder Name</label>
                      <input type="text" placeholder="John Doe" value={mobileName} onChange={(e) => setMobileName(e.target.value)} required
                        style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--pp-border)', borderRadius: 8, fontSize: 15, outline: 'none', background: 'transparent' }} />
                    </div>
                  </div>
                )}
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <button type="button" className="pp-ghost-btn" onClick={() => setStep(3)}>← Back</button>
              <button type="submit" className="pp-btn pp-btn-primary" disabled={loading} style={{ minWidth: 160 }}>
                {loading ? <><i className="ti ti-loader" style={{ animation: 'spin 1s linear infinite', marginRight: 8 }}/> Processing...</> : `Pay ${fee} XAF`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
function PatConsultations({ consultations, onJoinCall, refresh, showToast }) {
  const handleUpdate = async (item, status) => {
    try {
      const isAppt = item.healthType !== undefined;
      const url = isAppt ? `/users/me/appointments/${item._id||item.id}/status` : `/users/me/consultations/${item._id||item.id}/status`;
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
      const url = isAppt ? `/users/me/appointments/${item._id||item.id}` : `/users/me/consultations/${item._id||item.id}`;
      await API.delete(url);
      if (showToast) showToast("Deleted successfully", "success");
      if (refresh) refresh();
    } catch(e) {
      if (showToast) showToast("Failed to delete", "error");
    }
  };
  const navigate = useNavigate();
  return (
    <div className="pp-animate" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="pp-page-hd" style={{ marginBottom: 24 }}>
        <h1 className="pp-page-title">Video Consultations</h1>
        <p className="pp-page-sub">Manage your online doctor visits</p>
      </div>
      <div className="pp-card">
        {(!consultations || consultations.length === 0) ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--pp-muted)" }}>No video consultations scheduled.</div>
        ) : (
          <table className="pp-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--pp-border)", textAlign: "left" }}>
                <th style={{ padding: 16 }}>Doctor</th>
                <th style={{ padding: 16 }}>Date & Time</th>
                <th style={{ padding: 16 }}>Status</th>
                <th style={{ padding: 16, textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {consultations.map(c => (
                <tr key={c._id || c.id} style={{ borderBottom: "1px solid var(--pp-border)" }}>
                  <td style={{ padding: 16, fontWeight: 600 }}>Dr. {c.doctorId?.userId?.name || c.doctorName || "Unknown"}</td>
                  <td style={{ padding: 16 }}>{new Date(c.date).toLocaleDateString()} at {c.time}</td>
                  <td style={{ padding: 16 }}><span style={{ padding: "4px 8px", borderRadius: 12, fontSize: 12, background: c.status==="APPROVED"?"#e6f4ea":"#fef7e0", color: c.status==="APPROVED"?"#137333":"#b06000", fontWeight: 600 }}>{c.status}</span></td>
                  <td style={{ padding: 16, textAlign: "right" }}>
                    <button className="pp-ghost-btn" style={{color:"red", marginRight: 10}} onClick={() => handleDelete(c)}>Delete</button>
                    
                    {c.status?.toLowerCase() === "pending" && <div style={{display:"inline-flex", gap:6, marginRight:10}}>
                      <button className="pp-btn" style={{background:"#e6f4ea",color:"#137333",padding:"6px 12px",fontSize:13}} onClick={()=>handleUpdate(c, "accepted")}>Accept</button>
                      <button className="pp-btn" style={{background:"#fce8e6",color:"#c5221f",padding:"6px 12px",fontSize:13}} onClick={()=>handleUpdate(c, "declined")}>Reject</button>
                    </div>}
                    <button className="pp-btn pp-btn-primary" disabled={!["APPROVED","CONFIRMED","SCHEDULED","ACCEPTED"].includes(c.status?.toUpperCase())} onClick={() => onJoinCall(c.roomId || c._id || c.id)}>Join Call <i className="ti ti-video" style={{marginLeft: 8}}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function PatHomeVisit({ homeVisits, refresh, showToast }) {
  const navigate = useNavigate();

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this home visit?")) return;
    try {
      await API.delete(`/appointments/${id}`);
      if (showToast) showToast("Visit deleted", "success");
      if (refresh) refresh();
    } catch (e) {
      if (showToast) showToast("Failed to delete", "error");
    }
  };

  return (
    <div className="pp-animate" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="pp-page-hd" style={{ marginBottom: 24 }}>
        <h1 className="pp-page-title">Home Visits</h1>
        <p className="pp-page-sub">Track your requested home visits</p>
      </div>
      <div className="pp-card">
        {(!homeVisits || homeVisits.length === 0) ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--pp-muted)" }}>No home visits requested.</div>
        ) : (
          <table className="pp-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--pp-border)", textAlign: "left" }}>
                <th style={{ padding: 16 }}>Doctor</th>
                <th style={{ padding: 16 }}>Date & Time</th>
                <th style={{ padding: 16 }}>Address</th>
                <th style={{ padding: 16 }}>Status</th>
                <th style={{ padding: 16, textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {homeVisits.map(h => (
                <tr key={h._id || h.id} style={{ borderBottom: "1px solid var(--pp-border)" }}>
                  <td style={{ padding: 16, fontWeight: 600 }}>Dr. {h.doctorId?.userId?.name || h.doctorName || "Unknown"}</td>
                  <td style={{ padding: 16 }}>{new Date(h.date).toLocaleDateString()} at {h.time}</td>
                  <td style={{ padding: 16, maxWidth: 150, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.visitAddress}</td>
                  <td style={{ padding: 16 }}><span style={{ padding: "4px 8px", borderRadius: 12, fontSize: 12, background: h.status==="APPROVED"?"#e6f4ea":"#fef7e0", color: h.status==="APPROVED"?"#137333":"#b06000", fontWeight: 600 }}>{h.status}</span></td>
                  <td style={{ padding: 16, textAlign: "right" }}>
                    <button className="pp-ghost-btn" style={{color:"red", marginRight: 10}} onClick={() => handleDelete(h._id || h.id)}>Delete</button>
                    <button className="pp-btn pp-btn-primary" onClick={() => navigate(`/livemap?visit=${h.trackingId || h._id}`)}>Live Map <i className="ti ti-map-pin" style={{marginLeft: 8}}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function PatPrescriptions({ prescriptions, user, refresh, showToast }) {
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this prescription?")) return;
    try {
      await API.delete(`/users/me/prescriptions/${id}`);
      if (showToast) showToast("Deleted successfully", "success");
      if (refresh) refresh();
    } catch(e) {
      if (showToast) showToast("Failed to delete", "error");
    }
  };
  const [selected, setSelected] = useState(null);

  const printPresc = (presc) => {
    const pName = user?.name || "Patient";
    const html = `
      <html><head><title>Print Prescription</title><style>
        body { font-family: sans-serif; padding: 40px; color: #0f172a; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
        .header p { margin: 4px 0 0; color: #64748b; }
        .info { display: flex; justify-content: space-between; margin-bottom: 20px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
        th { background: #f8fafc; }
      </style></head><body>
        <div class="header"><img src="/logo.png" style="height:50px; object-fit:contain; margin-bottom:10px;" /><p>Official Prescription</p></div>
        <div class="info"><div>Patient: ${pName}</div><div>Date: ${presc.createdAt ? new Date(presc.createdAt).toISOString().split('T')[0] : presc.date}</div></div>
        ${presc.diagnosis ? `<p><strong>Diagnosis:</strong> ${presc.diagnosis}</p>` : ''}
        <table><thead><tr><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr></thead><tbody>
          ${presc.medicines && presc.medicines.length > 0 
            ? presc.medicines.map(m => `<tr><td><strong>${m.name}</strong></td><td>${m.dosage||'-'}</td><td>${m.frequency||'-'}</td><td>${m.duration||'-'}</td></tr>`).join('')
            : `<tr><td><strong>${presc.medication}</strong></td><td>${presc.dosage||'-'}</td><td>-</td><td>${presc.duration||'-'}</td></tr>`
          }
        </tbody></table>
        ${presc.notes ? `<div style="margin-top: 20px;"><h3>Clinical Notes</h3><p>${presc.notes}</p></div>` : ''}
        <div style="margin-top: 60px; text-align: right;"><div>___________________________</div><div style="margin-top: 8px;">Doctor's Signature</div></div>
      </body></html>`;
    const win = window.open('', '_blank');
    win.document.write(html); win.document.close(); win.focus();
    setTimeout(() => { win.print(); win.close(); }, 250);
  };

  return (
    <div className="pp-animate" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="pp-page-hd" style={{ marginBottom: 24 }}>
        <h1 className="pp-page-title">Prescriptions</h1>
        <p className="pp-page-sub">Active and past medications</p>
      </div>
      <div className="pp-card">
        {(!prescriptions || prescriptions.length === 0) ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--pp-muted)" }}>No prescriptions found.</div>
        ) : (
          <div className="pp-tbl-wrap">
            <table className="pp-table">
              <thead>
                <tr>
                  <th style={{ padding: "12px 16px" }}>Medications</th>
                  <th style={{ padding: "12px 16px" }}>Diagnosis</th>
                  <th style={{ padding: "12px 16px" }}>Doctor</th>
                  <th style={{ padding: "12px 16px" }}>Date</th>
                  <th style={{ padding: "12px 16px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map(p => (
                  <tr key={p.id || p._id}>
                    <td style={{ padding: 16 }}>{Array.isArray(p.medicines) && p.medicines.length > 0 ? p.medicines.map(m=>m.name).join(", ") : (p.medication || "-")}</td>
                    <td style={{ padding: 16 }}>{p.diagnosis || "-"}</td>
                    <td style={{ padding: 16 }}>Dr. {p.doctorName}</td>
                    <td style={{ padding: 16 }}>{p.createdAt ? new Date(p.createdAt).toISOString().split("T")[0] : p.date}</td>
                    <td style={{ padding: 16 }}>
                      <button className="pp-btn-primary" style={{padding: "6px 12px", fontSize: 13}} onClick={() => setSelected(p)}>View & Print</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selected && (
        <Modal title="Prescription Details" onClose={() => setSelected(null)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, color: "var(--pp-dark)" }}>Dr. {selected.doctorName}</h2>
              <div style={{ fontSize: 13, color: "var(--pp-muted)", marginTop: 4 }}>Date: {selected.createdAt ? new Date(selected.createdAt).toISOString().split("T")[0] : selected.date}</div>
            </div>
            <button className="pp-btn-primary" onClick={() => printPresc(selected)}><i className="ti ti-printer" style={{marginRight: 6}}/> Print A4</button>
          </div>
          {selected.diagnosis && (
            <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <strong>Diagnosis / Condition:</strong> {selected.diagnosis}
            </div>
          )}
          <h3 style={{ fontSize: 15, marginBottom: 8, borderBottom: "1px solid #e2e8f0", paddingBottom: 4 }}>Medications</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
            <thead>
              <tr style={{background: "#f8fafc"}}>
                <th style={{padding: 8, textAlign: "left", borderBottom: "1px solid #e2e8f0"}}>Medication</th>
                <th style={{padding: 8, textAlign: "left", borderBottom: "1px solid #e2e8f0"}}>Dosage</th>
                <th style={{padding: 8, textAlign: "left", borderBottom: "1px solid #e2e8f0"}}>Frequency</th>
                <th style={{padding: 8, textAlign: "left", borderBottom: "1px solid #e2e8f0"}}>Duration</th>
              </tr>
            </thead>
            <tbody>
              {selected.medicines && selected.medicines.length > 0 ? selected.medicines.map((m, i) => (
                <tr key={i}>
                  <td style={{padding: 8, borderBottom: "1px solid #e2e8f0", fontWeight: "bold"}}>{m.name}</td>
                  <td style={{padding: 8, borderBottom: "1px solid #e2e8f0"}}>{m.dosage || "-"}</td>
                  <td style={{padding: 8, borderBottom: "1px solid #e2e8f0"}}>{m.frequency || "-"}</td>
                  <td style={{padding: 8, borderBottom: "1px solid #e2e8f0"}}>{m.duration || "-"}</td>
                </tr>
              )) : (
                <tr>
                  <td style={{padding: 8, borderBottom: "1px solid #e2e8f0", fontWeight: "bold"}}>{selected.medication}</td>
                  <td style={{padding: 8, borderBottom: "1px solid #e2e8f0"}}>{selected.dosage || "-"}</td>
                  <td style={{padding: 8, borderBottom: "1px solid #e2e8f0"}}>-</td>
                  <td style={{padding: 8, borderBottom: "1px solid #e2e8f0"}}>{selected.duration || "-"}</td>
                </tr>
              )}
            </tbody>
          </table>
          {selected.notes && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, marginBottom: 8, borderBottom: "1px solid #e2e8f0", paddingBottom: 4 }}>Clinical Notes</h3>
              <p style={{ margin: 0, fontSize: 14, color: "var(--pp-dark)", lineHeight: 1.5 }}>{selected.notes}</p>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
function PatRecords({ records, user }) {
  const [selected, setSelected] = useState(null);

  const printRecord = (r) => {
    const pName = user?.name || "Patient";
    const html = `
      <html><head><title>Print Medical Record</title><style>
        body { font-family: sans-serif; padding: 40px; color: #0f172a; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
        .header p { margin: 4px 0 0; color: #64748b; }
        .info { display: flex; justify-content: space-between; margin-bottom: 20px; font-weight: bold; }
        .section { margin-top: 20px; }
        .section h3 { margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        .vitals-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #f8fafc; padding: 15px; border-radius: 8px; }
      </style></head><body>
        <div class="header"><img src="/logo.png" style="height:50px; object-fit:contain; margin-bottom:10px;" /><p>Official Medical Record</p></div>
        <div class="info"><div>Patient: ${pName}</div><div>Date: ${r.date}</div></div>
        <h2>${r.title} <span style="font-size:14px;font-weight:normal;color:#64748b;text-transform:capitalize;">(${r.type})</span></h2>
        <div class="section"><h3>Clinical Notes</h3><p>${r.description}</p></div>
        ${r.vitals && (r.vitals.bp || r.vitals.hr || r.vitals.temp || r.vitals.weight) ? `
          <div class="section"><h3>Vitals</h3><div class="vitals-grid">
            ${r.vitals.bp ? `<div><small>Blood Pressure</small><br/><strong>${r.vitals.bp}</strong></div>` : ''}
            ${r.vitals.hr ? `<div><small>Heart Rate</small><br/><strong>${r.vitals.hr}</strong></div>` : ''}
            ${r.vitals.temp ? `<div><small>Temperature</small><br/><strong>${r.vitals.temp}</strong></div>` : ''}
            ${r.vitals.weight ? `<div><small>Weight</small><br/><strong>${r.vitals.weight}</strong></div>` : ''}
          </div></div>` : ''}
        ${r.symptoms ? `<div class="section"><h3>Symptoms</h3><p>${r.symptoms}</p></div>` : ''}
        ${r.treatmentPlan ? `<div class="section"><h3>Treatment Plan</h3><p>${r.treatmentPlan}</p></div>` : ''}
        ${r.attachment ? `<div class="section"><h3>Attachment</h3><br/><img src="${r.attachment}" style="max-width: 100%; max-height: 400px; border-radius: 8px;"/></div>` : ''}
      </body></html>`;
    const win = window.open('', '_blank');
    win.document.write(html); win.document.close(); win.focus();
    setTimeout(() => { win.print(); win.close(); }, 250);
  };

  return (
    <div className="pp-animate" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="pp-page-hd" style={{ marginBottom: 24 }}>
        <h1 className="pp-page-title">Medical Records</h1>
        <p className="pp-page-sub">Your complete health history and reports</p>
      </div>
      <div className="pp-card" style={{ padding: 24 }}>
        {(!records || records.length === 0) ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--pp-muted)" }}>No medical records found.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {records.map(r => (
              <div key={r.id || r._id} onClick={() => setSelected(r)} style={{ cursor: "pointer", display: "flex", gap: 16, padding: "16px", borderRadius: 8, border: "1px solid var(--pp-border)", transition: "0.2s", ":hover": {background: "#f8fafc"} }}>
                <div style={{ width: 48, height: 48, borderRadius: 8, background: "rgba(30, 136, 229, 0.1)", color: "var(--pp-blue)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                  <i className={`ti ${r.type === 'imaging' ? 'ti-photo' : r.type === 'lab' ? 'ti-flask' : 'ti-file-description'}`} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: "var(--pp-dark)" }}>{r.title}</div>
                    <div style={{ fontSize: 12, color: "var(--pp-muted)", background: "var(--pp-bg)", padding: "4px 8px", borderRadius: 12, textTransform: "capitalize", fontWeight: 600 }}>{r.type}</div>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--pp-dark)", opacity: 0.8, marginBottom: 8 }}>Dr. {r.doctorName} • {r.date}</div>
                  <div style={{ fontSize: 14, color: "var(--pp-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "500px" }}>{r.description}</div>
                  <div style={{ fontSize: 12, color: "var(--pp-blue)", marginTop: 8, fontWeight: 600 }}>Click to view full record →</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <Modal title="Medical Record" onClose={() => setSelected(null)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, color: "var(--pp-dark)" }}>{selected.title}</h2>
              <div style={{ fontSize: 13, color: "var(--pp-muted)", marginTop: 4 }}>Dr. {selected.doctorName} • {selected.date}</div>
            </div>
            <button className="pp-btn-primary" onClick={() => printRecord(selected)}><i className="ti ti-printer" style={{marginRight: 6}}/> Print A4</button>
          </div>
          <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, marginBottom: 16 }}>
             <strong>Type:</strong> <span style={{textTransform: "capitalize"}}>{selected.type}</span>
          </div>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, marginBottom: 8, borderBottom: "1px solid #e2e8f0", paddingBottom: 4 }}>Clinical Notes</h3>
            <p style={{ margin: 0, fontSize: 14, color: "var(--pp-dark)", lineHeight: 1.5 }}>{selected.description}</p>
          </div>
          {selected.vitals && (selected.vitals.bp || selected.vitals.hr || selected.vitals.temp || selected.vitals.weight) && (
            <div style={{background: "#f8fafc", padding: "12px", borderRadius: 8, marginBottom: 16, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12}}>
              {selected.vitals.bp && <div><span style={{color: "#64748b", fontSize: 11, display: "block"}}>Blood Pressure</span><strong style={{fontSize: 13, color: "#0f172a"}}>{selected.vitals.bp}</strong></div>}
              {selected.vitals.hr && <div><span style={{color: "#64748b", fontSize: 11, display: "block"}}>Heart Rate</span><strong style={{fontSize: 13, color: "#0f172a"}}>{selected.vitals.hr}</strong></div>}
              {selected.vitals.temp && <div><span style={{color: "#64748b", fontSize: 11, display: "block"}}>Temperature</span><strong style={{fontSize: 13, color: "#0f172a"}}>{selected.vitals.temp}</strong></div>}
              {selected.vitals.weight && <div><span style={{color: "#64748b", fontSize: 11, display: "block"}}>Weight</span><strong style={{fontSize: 13, color: "#0f172a"}}>{selected.vitals.weight}</strong></div>}
            </div>
          )}
          {selected.symptoms && <div style={{marginBottom: 16}}><h3 style={{ fontSize: 15, marginBottom: 4, borderBottom: "1px solid #e2e8f0", paddingBottom: 4 }}>Symptoms</h3><span style={{fontSize: 14, color: "var(--pp-dark)"}}>{selected.symptoms}</span></div>}
          {selected.treatmentPlan && <div style={{marginBottom: 16}}><h3 style={{ fontSize: 15, marginBottom: 4, borderBottom: "1px solid #e2e8f0", paddingBottom: 4 }}>Treatment Plan</h3><span style={{fontSize: 14, color: "var(--pp-dark)"}}>{selected.treatmentPlan}</span></div>}
          {selected.attachment && <div><h3 style={{ fontSize: 15, marginBottom: 8, borderBottom: "1px solid #e2e8f0", paddingBottom: 4 }}>Attachment</h3><img src={selected.attachment} alt="Attachment" style={{maxHeight: 300, borderRadius: 8, objectFit: "cover", border: "1px solid #e2e8f0"}} /></div>}
        </Modal>
      )}
    </div>
  );
}
function PatPayments({ payments, user }) {
  const printInvoice = (p) => {
    const html = `
      <html><head><title>Print Receipt</title><style>
        body { font-family: sans-serif; padding: 40px; color: #0f172a; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
        .header p { margin: 4px 0 0; color: #64748b; }
        .info { display: flex; justify-content: space-between; margin-bottom: 20px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
        th { background: #f8fafc; }
        .total { text-align: right; margin-top: 20px; font-size: 20px; font-weight: bold; }
      </style></head><body>
        <div class="header"><img src="/logo.png" style="height:50px; object-fit:contain; margin-bottom:10px;" /><p>Official Receipt</p></div>
        <div class="info"><div>Patient: ${user?.name || "Patient"}</div><div>Date: ${p.date}</div></div>
        <table><thead><tr><th>Description / Service</th><th>Method</th><th>Status</th><th>Amount</th></tr></thead><tbody>
          <tr><td>${p.service}</td><td>${p.method || 'Cash'}</td><td>${p.status}</td><td>${p.amount} FCFA</td></tr>
        </tbody></table>
        <div class="total">Total Paid: ${p.amount} FCFA</div>
        <div style="margin-top: 60px; text-align: center; color: #64748b; font-size: 13px;">Thank you for choosing ToothEase Clinic!</div>
      </body></html>`;
    const win = window.open('', '_blank');
    win.document.write(html); win.document.close(); win.focus();
    setTimeout(() => { win.print(); win.close(); }, 250);
  };

  return (
    <div className="pp-animate" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="pp-page-hd" style={{ marginBottom: 24 }}>
        <h1 className="pp-page-title">Payments & Invoices</h1>
        <p className="pp-page-sub">View your billing history</p>
      </div>
      <div className="pp-card">
        {(!payments || payments.length === 0) ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--pp-muted)" }}>No payments found.</div>
        ) : (
          <div className="pp-tbl-wrap">
            <table className="pp-table">
              <thead>
                <tr>
                  <th style={{ padding: "12px 16px" }}>Service</th>
                  <th style={{ padding: "12px 16px" }}>Doctor</th>
                  <th style={{ padding: "12px 16px" }}>Amount</th>
                  <th style={{ padding: "12px 16px" }}>Method</th>
                  <th style={{ padding: "12px 16px" }}>Date</th>
                  <th style={{ padding: "12px 16px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id || p._id}>
                    <td style={{ padding: 16 }}>{p.service}</td>
                    <td style={{ padding: 16 }}>Dr. {p.doctorName}</td>
                    <td style={{ padding: 16, fontWeight: 700 }}>{p.amount} FCFA</td>
                    <td style={{ padding: 16 }}>{p.method || "Cash"}</td>
                    <td style={{ padding: 16 }}>{p.date}</td>
                    <td style={{ padding: 16 }}>
                      <button className="pp-btn-primary" style={{padding: "6px 12px", fontSize: 13}} onClick={() => printInvoice(p)}><i className="ti ti-printer" style={{marginRight: 6}}/> Print</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
function PatMessages({ showToast }) {
  const [contacts, setContacts] = React.useState([]);
  const [selId, setSelId] = React.useState("admin");
  const [msgs, setMsgs] = React.useState([]);
  const [msgText, setMsgText] = React.useState("");
  const endRef = React.useRef(null);

  React.useEffect(() => {
    API.get("/doctors").then(r => {
      if (r.data.success) {
        setContacts([
          { id: "admin", name: "Administrator", role: "Support Team" },
          ...r.data.doctors.map(d => ({ 
            id: d.user?._id || d.id || d._id, 
            name: d.name, 
            role: d.specialty || "Doctor", 
            avatar: d.user?.avatar 
          }))
        ]);
      }
    }).catch(() => {});
  }, []);

  const load = React.useCallback(async () => {
    if (!selId) return;
    try {
      const r = await API.get(`/messages/${selId}`);
      if (r.data.success) setMsgs(r.data.messages);
    } catch {}
  }, [selId]);

  React.useEffect(() => { load(); }, [selId, load]);
  React.useEffect(() => { const t = setInterval(load, 2000); return () => clearInterval(t); }, [load]);
  React.useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    if (!msgText.trim() || !selId) return;
    try {
      await API.post("/messages", { receiverId: selId, text: msgText.trim() });
      setMsgText("");
      load();
    } catch {
      showToast("Message failed to send", "error");
    }
  };

  const selContact = contacts.find(c => c.id === selId);

  return (
    <div className="pp-animate" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 180px)", background: "#fff", borderRadius: 16, border: "1px solid var(--pp-border)", overflow: "hidden" }}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--pp-border)", background: "var(--pp-bg)" }}>
        <h2 style={{ margin: 0, fontSize: 18, color: "var(--pp-dark)" }}>Messages</h2>
      </div>
      
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{ width: 280, borderRight: "1px solid var(--pp-border)", overflowY: "auto", background: "var(--pp-bg)" }}>
          {contacts.map(c => (
            <div key={c.id} onClick={() => setSelId(c.id)} 
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", cursor: "pointer", borderBottom: "1px solid var(--pp-border)", background: selId === c.id ? "#fff" : "transparent", borderLeft: selId === c.id ? "4px solid var(--pp-blue)" : "4px solid transparent" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--pp-blue)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 }}>
                {c.avatar ? <img src={c.avatar} style={{width:"100%", height:"100%", borderRadius:"50%"}} alt=""/> : c.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--pp-dark)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                <div style={{ fontSize: 12, color: "var(--pp-muted)" }}>{c.role}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fff" }}>
          {selContact && (
            <>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--pp-border)", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: "var(--pp-dark)" }}>{selContact.name}</div>
              </div>
              
              <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16, background: "#f8fafc" }}>
                {msgs.length === 0 && <div style={{ textAlign: "center", color: "var(--pp-muted)", marginTop: 40 }}>No messages yet. Say hello!</div>}
                {msgs.map(m => {
                  const isMe = m.from === "patient";
                  return (
                    <div key={m.id} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "75%" }}>
                      <div style={{ background: isMe ? "var(--pp-blue)" : "#fff", color: isMe ? "#fff" : "var(--pp-dark)", padding: "12px 16px", borderRadius: 16, borderBottomRightRadius: isMe ? 4 : 16, borderBottomLeftRadius: isMe ? 16 : 4, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", fontSize: 14, lineHeight: 1.5, border: isMe ? "none" : "1px solid var(--pp-border)" }}>
                        {m.text}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--pp-muted)", marginTop: 6, textAlign: isMe ? "right" : "left" }}>{m.ts}</div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              <div style={{ padding: 20, borderTop: "1px solid var(--pp-border)", display: "flex", gap: 12, background: "#fff" }}>
                <input className="pp-input" style={{ flex: 1, margin: 0, background: "var(--pp-bg)" }} placeholder="Type your message..." value={msgText} onChange={e => setMsgText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} />
                <button className="pp-btn pp-btn-primary" style={{ padding: "0 24px" }} onClick={send}>Send <i className="ti ti-send" style={{ marginLeft: 8 }}/></button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
function PatNotifications({ notifications, toast, refresh }) {
  const clearAll = async () => {
    if(!window.confirm("Clear all notifications?")) return;
    try { await API.delete("/users/me/notifications/clear"); toast("Cleared"); refresh(); } catch {}
  };

  const del = async (id) => {
    try { await API.delete(`/users/me/notifications/${id}`); refresh(); } catch {}
  };

  return (
    <div className="pp-animate" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="pp-page-hd" style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="pp-page-title">Notifications</h1>
          <p className="pp-page-sub">Alerts and updates</p>
        </div>
        {notifications?.length > 0 && <button className="pp-btn-outline" style={{color: "#ef4444", borderColor: "#ef4444"}} onClick={clearAll}><i className="ti ti-trash" style={{marginRight: 6}}/> Clear All</button>}
      </div>
      <div className="pp-card" style={{padding: 0}}>
        {(!notifications || notifications.length === 0) && <div style={{ padding: 40, textAlign: "center", color: "var(--pp-muted)" }}>No new notifications.</div>}
        {notifications?.map(n => (
          <div key={n.id||n._id} style={{display:"flex",gap:14,padding:"16px 20px",borderBottom:"1px solid var(--pp-border)", alignItems: "flex-start"}}>
            <div style={{width: 40, height: 40, borderRadius: "50%", background: "rgba(30, 136, 229, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--pp-blue)", flexShrink: 0}}>
              <i className="ti ti-bell" style={{fontSize: 20}} />
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:15, color: "var(--pp-dark)"}}>{n.title}</div>
              <div style={{fontSize:14,color:"var(--pp-muted)",marginTop:4, lineHeight: 1.5}}>{n.body}</div>
            </div>
            <button className="pp-icon-btn" style={{color: "#ef4444", flexShrink: 0}} onClick={() => del(n.id||n._id)}><i className="ti ti-x"/></button>
          </div>
        ))}
      </div>
    </div>
  );
}
function PatProfile({ patient, toast, refresh }) {
  const [f, setF] = useState({
    name: patient?.name || "",
    email: patient?.email || "",
    phone: patient?.phone || "",
    dob: patient?.dob ? new Date(patient?.dob).toISOString().split('T')[0] : "",
    country: patient?.country || "Cameroon",
    address: patient?.address || "",
    bloodType: patient?.bloodType || "",
    allergies: patient?.allergies || "",
    emergency: patient?.emergency || "",
    avatar: patient?.avatar || ""
  });

  useEffect(() => {
    if(patient) {
      setF({
        name: patient.name || "",
        email: patient.email || "",
        phone: patient.phone || "",
        dob: patient.dob ? new Date(patient.dob).toISOString().split('T')[0] : "",
        country: patient.country || "Cameroon",
        address: patient.address || "",
        bloodType: patient.bloodType || "",
        allergies: patient.allergies || "",
        emergency: patient.emergency || "",
        avatar: patient.avatar || ""
      });
    }
  }, [patient]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setF({ ...f, avatar: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => setF({ ...f, avatar: "" });

  const save = async () => {
    try {
      await API.patch("/users/me", f);
      toast("Profile updated successfully!");
      refresh();
    } catch (err) {
      toast(err.response?.data?.message || "Failed to update profile", "error");
    }
  };

  const delAccount = async () => {
    if(!window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) return;
    try {
      await API.delete("/users/me");
      toast("Account deleted. Logging out...");
      setTimeout(() => {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }, 1500);
    } catch { toast("Failed to delete account", "error"); }
  };

  return (
    <div className="pp-animate" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="pp-page-hd" style={{ marginBottom: 24 }}>
        <h1 className="pp-page-title">My Profile</h1>
        <p className="pp-page-sub">Manage your personal information</p>
      </div>
      <div className="pp-card" style={{ padding: "30px 24px" }}>
        
        <div style={{display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 30}}>
          <div style={{position: "relative", marginBottom: 16}}>
            {f.avatar ? <img src={f.avatar} style={{width: 120, height: 120, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--pp-border)", boxShadow: "0 4px 6px rgba(0,0,0,0.05)"}} /> : <Avatar name={f.name||"User"} size={120}/>}
            <label style={{position: "absolute", bottom: 0, right: 10, background: "var(--pp-blue)", color: "#fff", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2px solid #fff", boxShadow: "0 2px 4px rgba(0,0,0,0.1)"}}>
              <i className="ti ti-camera" />
              <input type="file" accept="image/*" style={{display: "none"}} onChange={handleImageUpload} />
            </label>
            {f.avatar && <div onClick={removeImage} style={{position: "absolute", bottom: 0, left: 10, background: "#ef4444", color: "#fff", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2px solid #fff", boxShadow: "0 2px 4px rgba(0,0,0,0.1)"}} title="Remove Avatar"><i className="ti ti-trash" style={{fontSize: 16}}/></div>}
          </div>
          <div style={{fontWeight:700,fontSize:20, color: "var(--pp-dark)"}}>{f.name}</div>
          <div style={{fontSize:14,color:"var(--pp-muted)"}}>{f.email}</div>
        </div>

        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 24px"}}>
          <div>
            <label style={{display: "block", fontSize: 13, fontWeight: 600, color: "var(--pp-dark)", marginBottom: 8}}>Full Name</label>
            <input className="pp-input" value={f.name} onChange={e=>setF({...f,name:e.target.value})} />
          </div>
          <div>
            <label style={{display: "block", fontSize: 13, fontWeight: 600, color: "var(--pp-dark)", marginBottom: 8}}>Email Address</label>
            <input className="pp-input" value={f.email} disabled style={{background: "#f8fafc", cursor: "not-allowed"}} />
          </div>
          <div>
            <label style={{display: "block", fontSize: 13, fontWeight: 600, color: "var(--pp-dark)", marginBottom: 8}}>Phone Number</label>
            <input className="pp-input" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})} placeholder="+237..." />
          </div>
          <div>
            <label style={{display: "block", fontSize: 13, fontWeight: 600, color: "var(--pp-dark)", marginBottom: 8}}>Date of Birth</label>
            <input className="pp-input" type="date" value={f.dob} onChange={e=>setF({...f,dob:e.target.value})} />
          </div>
          <div>
            <label style={{display: "block", fontSize: 13, fontWeight: 600, color: "var(--pp-dark)", marginBottom: 8}}>Country</label>
            <input className="pp-input" value={f.country} onChange={e=>setF({...f,country:e.target.value})} />
          </div>
          <div>
            <label style={{display: "block", fontSize: 13, fontWeight: 600, color: "var(--pp-dark)", marginBottom: 8}}>Home Address</label>
            <input className="pp-input" value={f.address} onChange={e=>setF({...f,address:e.target.value})} placeholder="City, Street..." />
          </div>
        </div>

        <div style={{height: 1, background: "var(--pp-border)", margin: "30px 0"}}></div>
        <h3 style={{fontSize: 16, fontWeight: 700, color: "var(--pp-dark)", marginBottom: 20}}>Medical Information</h3>

        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 24px"}}>
          <div>
            <label style={{display: "block", fontSize: 13, fontWeight: 600, color: "var(--pp-dark)", marginBottom: 8}}>Blood Type</label>
            <select className="pp-input" value={f.bloodType} onChange={e=>setF({...f,bloodType:e.target.value})}>
              <option value="">Select...</option>
              <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
              <option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
            </select>
          </div>
          <div>
            <label style={{display: "block", fontSize: 13, fontWeight: 600, color: "var(--pp-dark)", marginBottom: 8}}>Emergency Contact</label>
            <input className="pp-input" value={f.emergency} onChange={e=>setF({...f,emergency:e.target.value})} placeholder="Name / Phone" />
          </div>
          <div style={{gridColumn: "1 / -1"}}>
            <label style={{display: "block", fontSize: 13, fontWeight: 600, color: "var(--pp-dark)", marginBottom: 8}}>Allergies / Existing Conditions</label>
            <textarea className="pp-input" style={{height: 80, resize: "vertical"}} value={f.allergies} onChange={e=>setF({...f,allergies:e.target.value})} placeholder="List any known allergies..." />
          </div>
        </div>

        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40}}>
          <button className="pp-btn-outline" style={{color: "#ef4444", borderColor: "#ef4444"}} onClick={delAccount}><i className="ti ti-trash"/> Delete Account</button>
          <button className="pp-btn-primary" style={{padding: "12px 30px", fontSize: 15}} onClick={save}>Save Profile</button>
        </div>
      </div>

    </div>
  );
}

function PatMyChart({ dentalRecords }) {
  return (
    <div className="pp-animate" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="pp-page-hd" style={{ marginBottom: 24 }}>
        <h1 className="pp-page-title">My 3D Dental Chart</h1>
        <p className="pp-page-sub">Interactive view of your oral health</p>
      </div>
      <DentalChart records={dentalRecords} readOnly={true} />
    </div>
  );
}
