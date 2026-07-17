import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../../services/api";
import "../Styles/patient.css";
import JitsiVideoCall from "../../Components/JitsiVideoCall";
import AiScanner from "../../Components/AiScanner";
import DentalChart from "../../Components/DentalChart";
import RecoveryMonitor from "../../Components/RecoveryMonitor";
import HygieneTracker from "../../Components/HygieneTracker";
import MembershipPlans from "../../Components/MembershipPlans";
const uid = () => Math.random().toString(36).slice(2, 10);
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
      } catch (e) {
        console.error("Failed to fetch profile", e);
      }
      setPatient(patientData);
      try {
        const { data: docs } = await API.get("/doctors");
        if (docs?.success) setDoctors(docs.doctors || []);
      } catch (e) {
        console.error("Failed to fetch doctors", e);
      }
      try {
        const { data: appts } = await API.get("/appointments/my");
        if (appts?.success) {
          setAppointments(appts.appointments || []);
        }
      } catch (e) {
        console.error("Failed to fetch appointments", e);
      }
      try {
        const { data: cons } = await API.get("/users/me/consultations");
        if (cons?.success) setConsultations(cons.consultations || []);
      } catch (e) {
        console.error(e);
      }
      try {
        const { data: hv } = await API.get("/users/me/home-visits");
        if (hv?.success) setHomeVisits(hv.homeVisits || []);
      } catch (e) {
        console.error(e);
      }
      try {
        const { data: prescr } = await API.get("/users/me/prescriptions");
        if (prescr?.success) setPrescriptions(prescr.prescriptions || []);
      } catch (e) {
        console.error("Failed to fetch prescriptions", e);
      }
      try {
        const { data: recs } = await API.get("/users/me/records");
        if (recs?.success) setRecords(recs.records || []);
      } catch (e) {
        console.error("Failed to fetch records", e);
      }
      try {
        const { data: dRecs } = await API.get("/users/me/dental-records");
        if (dRecs?.success) setDentalRecords(dRecs.dentalRecords || []);
      } catch (e) {
        console.error("Failed to fetch dental records", e);
      }
      try {
        const { data: pays } = await API.get("/users/me/payments");
        if (pays?.success) setPayments(pays.payments || []);
      } catch (e) {
        console.error("Failed to fetch payments", e);
      }
      try {
        const { data: notifs } = await API.get("/users/me/notifications");
        if (notifs?.success) setNotifications(notifs.notifications || []);
      } catch (e) {
        console.error("Failed to fetch notifications", e);
      }
      setMessages([]);
    } catch (err) {
      console.error("Error loading patient data", err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);
  useEffect(() => {
    const t = setInterval(fetchAll, 5e3);
    return () => clearInterval(t);
  }, [fetchAll]);
  return { patient, doctors, appointments, prescriptions, consultations, homeVisits, payments, messages, notifications, dentalRecords, records, loading, refresh: fetchAll };
}
const getSessionPatientId = () => {
  try {
    const cur = JSON.parse(localStorage.getItem("stech_current_user"));
    if (cur && cur.role === "patient") return cur.id || cur._id;
  } catch {
  }
  try {
    const sess = JSON.parse(localStorage.getItem("stech_session"));
    if (sess && (sess.role === "patient" || sess.role === "PATIENT")) return sess.id || sess._id;
  } catch {
  }
  return null;
};
export default function PatientPanel({ patientId: propPatientId, onLogout }) {
  const navigate = useNavigate();
  const { patientId: urlPatientId } = useParams();
  const patientId = propPatientId || urlPatientId || getSessionPatientId();
  const [tab, setTab] = useState("overview");
  const [sideOpen, setSide] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeVideoCall, setActiveVideoCall] = useState(null);
  const showToast = useCallback((msg, type = "success") => setToast({ msg, type }), []);
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
    refresh
  } = usePatientData(patientId);
  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("stech_refresh", handler);
    return () => window.removeEventListener("stech_refresh", handler);
  }, [refresh]);
  useEffect(() => {
    const t = setInterval(refresh, 5e3);
    return () => clearInterval(t);
  }, [refresh]);
  const unreadCount = notifications.filter((n) => n.toId === patientId && !n.read).length;
  const unreadMsg = messages.filter((m) => m.toId === patientId && !m.read).length;
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
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans',sans-serif", flexDirection: "column", gap: 16, color: "#64748b" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 52 } }, "\u{1F9B7}"), /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: "'Playfair Display',serif" } }, "Patient not found"), /* @__PURE__ */ React.createElement("p", null, "ID: ", patientId || "undefined", " \u2014 please log in again."), /* @__PURE__ */ React.createElement("button", { className: "pp-btn pp-btn-primary", onClick: handleLogout }, "Back to Login"));
  }
  const combinedConsultations = [...consultations || [], ...(appointments || []).filter((a) => a.isVideoConsultation || a.healthType === "Video Consultation")];
  const combinedHomeVisits = [...homeVisits || [], ...(appointments || []).filter((a) => a.isHomeVisit || a.healthType === "Home Visit")];
  const sp = { patient, patientId, showToast, refresh, setTab, onJoinCall: (id) => {
    const finalRoom = id.startsWith("Stech-Consultation-") ? id : "Stech-Consultation-" + id;
    setActiveVideoCall(finalRoom);
  } };
  return /* @__PURE__ */ React.createElement("div", { className: "pp-root" }, /* @__PURE__ */ React.createElement("aside", { className: `pp-sidebar ${sideOpen ? "pp-sidebar--open" : ""}` }, /* @__PURE__ */ React.createElement("div", { className: "pp-sidebar-brand" }, /* @__PURE__ */ React.createElement("div", { className: "pp-brand-mark" }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-tooth" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "pp-brand-name" }, "ToothEase"), /* @__PURE__ */ React.createElement("div", { className: "pp-brand-sub" }, "Patient Portal")), /* @__PURE__ */ React.createElement("button", { className: "pp-sidebar-x", onClick: () => setSide(false) }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-x" }))), /* @__PURE__ */ React.createElement("div", { className: "pp-sidebar-card" }, /* @__PURE__ */ React.createElement(Avatar, { name: patient?.name, size: 42 }), /* @__PURE__ */ React.createElement("div", { className: "pp-sidebar-info" }, /* @__PURE__ */ React.createElement("strong", null, patient?.name), /* @__PURE__ */ React.createElement("span", null, patient?.forfait, " Plan"), patient?.membership && /* @__PURE__ */ React.createElement("span", { className: "pp-member-chip" }, "\u2B50 Member"))), /* @__PURE__ */ React.createElement("nav", { className: "pp-nav" }, NAV.map(
    (n, i) => n.section ? /* @__PURE__ */ React.createElement("div", { key: i, className: "pp-nav-section" }, n.section) : /* @__PURE__ */ React.createElement(
      "button",
      {
        key: n.key,
        className: `pp-nav-item ${tab === n.key ? "active" : ""}`,
        onClick: () => {
          setTab(n.key);
          setSide(false);
        }
      },
      /* @__PURE__ */ React.createElement("i", { className: `ti ${n.icon}` }),
      /* @__PURE__ */ React.createElement("span", null, n.label),
      n.key === "notifications" && unreadCount > 0 && /* @__PURE__ */ React.createElement("span", { className: "pp-nav-dot" }, unreadCount),
      n.key === "messages" && unreadMsg > 0 && /* @__PURE__ */ React.createElement("span", { className: "pp-nav-dot" }, unreadMsg)
    )
  )), /* @__PURE__ */ React.createElement("div", { className: "pp-sidebar-foot" }, /* @__PURE__ */ React.createElement(Avatar, { name: patient?.name, size: 32 }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, patient?.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, opacity: 0.65 } }, "Patient")), /* @__PURE__ */ React.createElement("button", { className: "pp-logout-btn", onClick: handleLogout, title: "Log out" }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-logout" })))), /* @__PURE__ */ React.createElement("div", { className: "pp-main" }, /* @__PURE__ */ React.createElement("header", { className: "pp-topbar" }, /* @__PURE__ */ React.createElement("button", { className: "pp-hamburger", onClick: () => setSide(true) }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-menu-2" })), /* @__PURE__ */ React.createElement("div", { className: "pp-topbar-title" }, NAV.find((n) => n.key === tab)?.label || "Dashboard"), /* @__PURE__ */ React.createElement("div", { className: "pp-topbar-right" }, /* @__PURE__ */ React.createElement("button", { className: "pp-icon-btn", onClick: () => setTab("messages"), title: "Messages" }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-message-circle" }), unreadMsg > 0 && /* @__PURE__ */ React.createElement("span", { className: "pp-notif-dot" }, unreadMsg)), /* @__PURE__ */ React.createElement("button", { className: "pp-icon-btn", onClick: () => setTab("notifications"), title: "Notifications" }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-bell" }), unreadCount > 0 && /* @__PURE__ */ React.createElement("span", { className: "pp-notif-dot" }, unreadCount)), /* @__PURE__ */ React.createElement("div", { className: "pp-topbar-profile", onClick: () => setTab("profile") }, /* @__PURE__ */ React.createElement(Avatar, { name: patient?.name, size: 30 }), /* @__PURE__ */ React.createElement("span", null, patient?.name?.split(" ")[0])), /* @__PURE__ */ React.createElement("button", { className: "pp-logout-pill", onClick: handleLogout }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-logout" }), " Logout"))), /* @__PURE__ */ React.createElement("main", { className: "pp-content" }, tab === "overview" && /* @__PURE__ */ React.createElement(PatOverview, { ...sp, appointments, consultations: combinedConsultations, prescriptions, payments, doctors }), tab === "my_chart" && /* @__PURE__ */ React.createElement(PatMyChart, { ...sp, dentalRecords }), tab === "ai_scan" && /* @__PURE__ */ React.createElement(AiScanner, { onBookRecommendation: () => setTab("book") }), tab === "recovery" && /* @__PURE__ */ React.createElement(RecoveryMonitor, null), tab === "appointments" && /* @__PURE__ */ React.createElement(PatAppointments, { ...sp, items: appointments, refresh, showToast }), tab === "book" && /* @__PURE__ */ React.createElement(PatBooking, { ...sp, patient, doctors }), tab === "consultations" && /* @__PURE__ */ React.createElement(PatConsultations, { ...sp, consultations: combinedConsultations }), tab === "home_visit" && /* @__PURE__ */ React.createElement(PatHomeVisit, { ...sp, homeVisits: combinedHomeVisits, refresh, showToast }), tab === "prescriptions" && /* @__PURE__ */ React.createElement(PatPrescriptions, { ...sp, prescriptions, refresh }), tab === "records" && /* @__PURE__ */ React.createElement(PatRecords, { ...sp, records }), tab === "hygiene" && /* @__PURE__ */ React.createElement(HygieneTracker, null), tab === "membership" && /* @__PURE__ */ React.createElement(MembershipPlans, { currentPlan: membershipPlan, onPlanUpdate: setMembershipPlan }), tab === "payments" && /* @__PURE__ */ React.createElement(PatPayments, { ...sp, payments }), tab === "messages" && /* @__PURE__ */ React.createElement(PatMessages, { ...sp, messages }), tab === "notifications" && /* @__PURE__ */ React.createElement(PatNotifications, { ...sp, notifications }), tab === "profile" && /* @__PURE__ */ React.createElement(PatProfile, { ...sp, patient }))), sideOpen && /* @__PURE__ */ React.createElement("div", { className: "pp-overlay", onClick: () => setSide(false) }), activeVideoCall && /* @__PURE__ */ React.createElement(JitsiVideoCall, { roomName: activeVideoCall, displayName: patient?.name || "Patient", onEndCall: () => setActiveVideoCall(null) }), toast && /* @__PURE__ */ React.createElement(Toast, { msg: toast.msg, type: toast.type, onClose: () => setToast(null) }));
}
const AVATAR_COLORS = ["#1e88e5", "#00bfa5", "#7c3aed", "#f44336", "#ff7043", "#0891b2", "#16a34a", "#be185d"];
function Avatar({ name = "?", size = 36 }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const color = AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  return /* @__PURE__ */ React.createElement("div", { className: "pp-avatar", style: { width: size, height: size, background: color, fontSize: size * 0.37, flexShrink: 0 } }, initials);
}
function Badge({ status }) {
  const MAP = { confirmed: "pp-b-green", active: "pp-b-green", paid: "pp-b-green", completed: "pp-b-green", online: "pp-b-green", accepted: "pp-b-green", pending: "pp-b-amber", scheduled: "pp-b-amber", inactive: "pp-b-gray", cancelled: "pp-b-red", busy: "pp-b-red", declined: "pp-b-red", premium: "pp-b-purple", standard: "pp-b-blue", basic: "pp-b-gray", video: "pp-b-purple", physical: "pp-b-blue", chat: "pp-b-teal" };
  return /* @__PURE__ */ React.createElement("span", { className: `pp-badge ${MAP[status?.toLowerCase()] || "pp-b-gray"}` }, status);
}
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return /* @__PURE__ */ React.createElement("div", { className: `pp-toast pp-toast--${type}` }, /* @__PURE__ */ React.createElement("span", { className: "pp-toast-icon" }, type === "success" ? "\u2713" : type === "error" ? "\u2715" : "\u2139"), msg, /* @__PURE__ */ React.createElement("button", { className: "pp-toast-close", onClick: onClose }, "\u2715"));
}
function Modal({ title, subtitle, onClose, children, width = 520 }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return /* @__PURE__ */ React.createElement("div", { className: "pp-modal-overlay", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "pp-modal", style: { maxWidth: width }, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "pp-modal-hd" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "pp-modal-title" }, title), subtitle && /* @__PURE__ */ React.createElement("div", { className: "pp-modal-sub" }, subtitle)), /* @__PURE__ */ React.createElement("button", { className: "pp-modal-close", onClick: onClose }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-x" }))), /* @__PURE__ */ React.createElement("div", { className: "pp-modal-bd" }, children)));
}
function ConfirmDialog({ msg, onConfirm, onCancel }) {
  return /* @__PURE__ */ React.createElement("div", { className: "pp-modal-overlay", onClick: onCancel }, /* @__PURE__ */ React.createElement("div", { className: "pp-modal", style: { maxWidth: 380 }, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "pp-modal-hd" }, /* @__PURE__ */ React.createElement("div", { className: "pp-modal-title" }, "\u26A0 Confirm")), /* @__PURE__ */ React.createElement("div", { className: "pp-modal-bd" }, /* @__PURE__ */ React.createElement("p", { style: { color: "var(--pp-muted)", marginBottom: 24, lineHeight: 1.7 } }, msg), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10 } }, /* @__PURE__ */ React.createElement("button", { className: "pp-btn pp-btn-ghost", style: { flex: 1 }, onClick: onCancel }, "Cancel"), /* @__PURE__ */ React.createElement("button", { className: "pp-btn pp-btn-danger", style: { flex: 1 }, onClick: onConfirm }, "Confirm")))));
}
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
  { key: "profile", icon: "ti-user-circle", label: "My Profile" }
];
function PatOverview({ patient, doctors = [], appointments, consultations, prescriptions, payments, setTab }) {
  const upcoming = appointments.filter((a) => a.status !== "cancelled").sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return /* @__PURE__ */ React.createElement("div", { className: "pp-animate" }, /* @__PURE__ */ React.createElement("div", { className: "pp-welcome-bar" }, /* @__PURE__ */ React.createElement("div", { className: "pp-welcome-text" }, /* @__PURE__ */ React.createElement("h1", null, "Good ", (/* @__PURE__ */ new Date()).getHours() < 12 ? "morning" : (/* @__PURE__ */ new Date()).getHours() < 18 ? "afternoon" : "evening", ", ", /* @__PURE__ */ React.createElement("em", null, patient?.name?.split(" ")[0]), "!"), /* @__PURE__ */ React.createElement("p", null, (/* @__PURE__ */ new Date()).toDateString(), " \xB7 Your dental health, all in one place.")), /* @__PURE__ */ React.createElement("button", { className: "pp-btn pp-btn-white", onClick: () => setTab("book") }, " ", /* @__PURE__ */ React.createElement("i", { className: "ti ti-calendar-plus" }), " Book Appointment")), /* @__PURE__ */ React.createElement("div", { className: "pp-stats-grid" }, [
    { icon: "ti-calendar-check", label: "Appointments", value: appointments.length, bg: "#dbeafe", c: "#1e88e5", nav: "appointments" },
    { icon: "ti-video", label: "Consultations", value: consultations.length, bg: "#ede9fe", c: "#7c3aed", nav: "consultations" },
    { icon: "ti-pill", label: "Prescriptions", value: prescriptions.length, bg: "#dcfce7", c: "#16a34a", nav: "prescriptions" },
    { icon: "ti-credit-card", label: "Payments", value: payments.length, bg: "#fef3c7", c: "#d97706", nav: "payments" }
  ].map((s) => /* @__PURE__ */ React.createElement("div", { key: s.label, className: "pp-stat-card", onClick: () => setTab(s.nav) }, /* @__PURE__ */ React.createElement("div", { className: "pp-stat-icon", style: { background: s.bg, color: s.c } }, /* @__PURE__ */ React.createElement("i", { className: `ti ${s.icon}` })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "pp-stat-label" }, s.label), /* @__PURE__ */ React.createElement("div", { className: "pp-stat-value" }, s.value)), /* @__PURE__ */ React.createElement("i", { className: "ti ti-chevron-right pp-stat-chevron" })))), /* @__PURE__ */ React.createElement("div", { className: "pp-two-col" }, /* @__PURE__ */ React.createElement("div", { className: "pp-card" }, /* @__PURE__ */ React.createElement("div", { className: "pp-card-hd" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "pp-card-title" }, "Upcoming Appointments")), /* @__PURE__ */ React.createElement("button", { className: "pp-ghost-btn", onClick: () => setTab("appointments") }, "View all \u2192")), upcoming.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "pp-empty" }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-calendar-off", style: { fontSize: 36, color: "var(--pp-border)" } }), /* @__PURE__ */ React.createElement("p", null, "No upcoming appointments"), /* @__PURE__ */ React.createElement("button", { className: "pp-btn pp-btn-primary pp-btn-sm", onClick: () => setTab("book") }, "Book one now")) : upcoming.slice(0, 4).map((a) => {
    const dateStr = a.date ? new Date(a.date).toISOString().split("T")[0] : "";
    return /* @__PURE__ */ React.createElement("div", { key: a._id || a.id, className: "pp-appt-row" }, /* @__PURE__ */ React.createElement("div", { className: "pp-appt-date-box" }, /* @__PURE__ */ React.createElement("span", { className: "pp-appt-day" }, dateStr.split("-")[2]), /* @__PURE__ */ React.createElement("span", { className: "pp-appt-mon" }, new Date(dateStr).toLocaleString("default", { month: "short" }))), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 14 } }, a.healthType), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--pp-muted)", marginTop: 2 } }, "Dr. ", a.doctorId?.userId?.name || a.doctorName || "Unknown", " \xB7 ", a.time)), /* @__PURE__ */ React.createElement(Badge, { status: a.status }));
  })), /* @__PURE__ */ React.createElement("div", { className: "pp-card" }, /* @__PURE__ */ React.createElement("div", { className: "pp-card-hd" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "pp-card-title" }, "Available Doctors"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12, marginTop: 12 } }, doctors.slice(0, 4).map((d) => /* @__PURE__ */ React.createElement("div", { key: d._id, style: { display: "flex", alignItems: "center", gap: 12 } }, /* @__PURE__ */ React.createElement(Avatar, { name: d.userId?.name || d.name, size: 36 }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600 } }, "Dr. ", d.userId?.name || d.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--pp-muted)" } }, d.specialty))))))));
}
function PatAppointments({ items, setTab, onJoinCall }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const filtered = items.filter((a) => (filter === "all" || a.status?.toLowerCase() === filter.toLowerCase()) && [a.healthType, a.doctorName].some((v) => v?.toLowerCase().includes(search.toLowerCase())));
  return /* @__PURE__ */ React.createElement("div", { className: "pp-animate" }, /* @__PURE__ */ React.createElement("div", { className: "pp-page-hd" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "pp-page-title" }, "My Appointments"), /* @__PURE__ */ React.createElement("p", { className: "pp-page-sub" }, items.length, " total")), /* @__PURE__ */ React.createElement("button", { className: "pp-btn pp-btn-primary", onClick: () => setTab("book") }, "+ Book New")), /* @__PURE__ */ React.createElement("div", { className: "pp-filter-bar" }, /* @__PURE__ */ React.createElement("div", { className: "pp-search-wrap" }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-search" }), /* @__PURE__ */ React.createElement("input", { className: "pp-search", placeholder: "Search treatment, doctor\u2026", value: search, onChange: (e) => setSearch(e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "pp-filter-tabs" }, ["all", "pending", "confirmed", "cancelled"].map((f) => /* @__PURE__ */ React.createElement("button", { key: f, className: `pp-filter-tab ${filter === f ? "active" : ""}`, onClick: () => setFilter(f) }, f.charAt(0).toUpperCase() + f.slice(1), " ", /* @__PURE__ */ React.createElement("span", { className: "pp-filter-count" }, f === "all" ? items.length : items.filter((a) => a.status === f).length))))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, filtered.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "pp-card" }, /* @__PURE__ */ React.createElement("div", { className: "pp-empty" }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-calendar-off", style: { fontSize: 36 } }), /* @__PURE__ */ React.createElement("p", null, "No appointments found."), /* @__PURE__ */ React.createElement("button", { className: "pp-btn pp-btn-primary pp-btn-sm", onClick: () => setTab("book") }, "Book Now"))), filtered.map((a) => {
    const isVideo = a.isVideoConsultation || a.type === "video";
    const isHome = a.isHomeVisit || a.type === "home";
    const typeIcon = isVideo ? "ti-video" : isHome ? "ti-home-heart" : "ti-building-hospital";
    const typeColor = isVideo ? "#7c3aed" : isHome ? "#eab308" : "#1e88e5";
    const typeBg = isVideo ? "#ede9fe" : isHome ? "#fef08a" : "#dbeafe";
    const dateStr = a.date ? new Date(a.date).toISOString().split("T")[0] : "";
    const docName = a.doctorId?.userId?.name || a.doctorName || "Unknown Doctor";
    return /* @__PURE__ */ React.createElement("div", { key: a._id || a.id, className: "pp-card pp-appt-card", style: { borderLeft: `4px solid ${typeColor}` } }, /* @__PURE__ */ React.createElement("div", { className: "pp-appt-card-left" }, /* @__PURE__ */ React.createElement("div", { className: "pp-appt-date-box pp-appt-date-box--lg", style: { background: typeBg, color: typeColor } }, /* @__PURE__ */ React.createElement("span", { className: "pp-appt-day" }, dateStr.split("-")[2]), /* @__PURE__ */ React.createElement("span", { className: "pp-appt-mon" }, new Date(dateStr).toLocaleString("default", { month: "short" }))), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 17 } }, /* @__PURE__ */ React.createElement("i", { className: `ti ${typeIcon}`, style: { marginRight: 6, color: typeColor } }), a.healthType), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--pp-muted)", marginTop: 4 } }, "Dr. ", docName, " \xB7 ", a.time), a.notes && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--pp-muted)", marginTop: 4, fontStyle: "italic" } }, `"${a.notes}"`), a.visitAddress && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--pp-muted)", marginTop: 4 } }, "\u{1F4CD} ", a.visitAddress), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, fontSize: 13, fontWeight: 700, color: "var(--pp-blue)" } }, Number(a.amount).toLocaleString("fr-CM"), " XAF"))), /* @__PURE__ */ React.createElement("div", { className: "pp-appt-card-right" }, /* @__PURE__ */ React.createElement(Badge, { status: a.status }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, marginTop: 8 } }, a.status === "PENDING" && /* @__PURE__ */ React.createElement("div", { style: { display: "inline-flex", gap: 6, marginRight: 10 } }, /* @__PURE__ */ React.createElement("button", { className: "pp-btn", style: { background: "#e6f4ea", color: "#137333", padding: "6px 12px", fontSize: 13 }, onClick: () => handleUpdate(a._id || a.id, "CONFIRMED") }, "Accept"), /* @__PURE__ */ React.createElement("button", { className: "pp-btn", style: { background: "#fce8e6", color: "#c5221f", padding: "6px 12px", fontSize: 13 }, onClick: () => handleUpdate(a._id || a.id, "CANCELLED") }, "Reject")), isVideo && ["scheduled", "confirmed", "CONFIRMED", "accepted", "APPROVED"].includes(a.status) && /* @__PURE__ */ React.createElement("button", { onClick: () => onJoinCall(a.roomId || a._id || a.id), className: "pp-btn pp-btn-primary pp-btn-sm", style: { textDecoration: "none", border: "none", cursor: "pointer" } }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-video" }), " Join Call"), isHome && (a.status === "scheduled" || a.status === "confirmed" || a.status === "pending" || a.status === "PENDING" || a.status === "accepted") && /* @__PURE__ */ React.createElement("a", { href: `/livemap?visit=${a.trackingId || a._id}`, className: "pp-btn pp-btn-primary pp-btn-sm", style: { textDecoration: "none", background: "#eab308", border: "none" } }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-map-pin" }), " Track Visit"), !isVideo && !isHome && /* @__PURE__ */ React.createElement("button", { className: "pp-ghost-btn", onClick: () => {
    } }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-eye" }), " View"), a.status !== "CANCELLED" && a.status !== "cancelled" && a.status !== "COMPLETED" && a.status !== "completed" && /* @__PURE__ */ React.createElement("button", { className: "pp-ghost-btn pp-danger-text", onClick: () => {
    } }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-x" }), " Cancel"))));
  })));
}
function PatBooking({ patient, doctors, setTab, showToast, refresh }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    type: "Clinic Visit",
    doctorId: "",
    date: "",
    time: "",
    notes: "",
    visitAddress: ""
  });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async () => {
    try {
      setLoading(true);
      const payload = {
        doctorId: form.doctorId,
        healthType: form.notes || "General Checkup",
        date: form.date,
        time: form.time,
        notes: form.type,
        isHomeVisit: form.type === "Home Visit",
        isVideoConsultation: form.type === "Video Consultation",
        visitAddress: form.visitAddress,
        roomId: form.type === "Video Consultation" ? uid() : "",
        trackingId: form.type === "Home Visit" ? uid() : ""
      };
      const { data } = await API.post("/appointments", payload);
      if (data?.success) {
        showToast("Booking successful!", "success");
        refresh();
        setTab("appointments");
      }
    } catch (e) {
      showToast(e.response?.data?.message || "Booking failed", "error");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "pp-animate", style: { maxWidth: 600, margin: "0 auto" } }, /* @__PURE__ */ React.createElement("div", { className: "pp-page-hd", style: { marginBottom: 24 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "pp-page-title" }, "Book an Appointment"), /* @__PURE__ */ React.createElement("p", { className: "pp-page-sub" }, "Step ", step, " of ", form.type === "Home Visit" ? 4 : 3))), /* @__PURE__ */ React.createElement("div", { className: "pp-card", style: { padding: 32 } }, step === 1 && /* @__PURE__ */ React.createElement("div", { className: "pp-animate" }, /* @__PURE__ */ React.createElement("h3", { style: { marginBottom: 16 } }, "Select Service Type"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, ["Clinic Visit", "Video Consultation", "Home Visit"].map((t) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: t,
      className: `pp-btn ${form.type === t ? "pp-btn-primary" : "pp-ghost-btn"}`,
      style: { justifyContent: "flex-start", padding: 16, border: form.type === t ? "none" : "1px solid var(--pp-border)" },
      onClick: () => setForm({ ...form, type: t })
    },
    /* @__PURE__ */ React.createElement("i", { className: `ti ${t === "Clinic Visit" ? "ti-building-hospital" : t === "Video Consultation" ? "ti-video" : "ti-home-heart"}`, style: { fontSize: 24, marginRight: 16 } }),
    /* @__PURE__ */ React.createElement("div", { style: { textAlign: "left" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600 } }, t), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, opacity: 0.8, marginTop: 4 } }, t === "Clinic Visit" ? "Visit our clinic in person" : t === "Video Consultation" ? "Talk to a doctor online" : "A doctor visits your home"))
  ))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "flex-end", marginTop: 24 } }, /* @__PURE__ */ React.createElement("button", { className: "pp-btn pp-btn-primary", onClick: () => setStep(2) }, "Next Step \u2192"))), step === 2 && /* @__PURE__ */ React.createElement("div", { className: "pp-animate" }, /* @__PURE__ */ React.createElement("h3", { style: { marginBottom: 16 } }, "Select a Doctor"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxHeight: 400, overflowY: "auto" } }, doctors.map((d) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: d._id || d.id,
      className: `pp-card ${form.doctorId === (d._id || d.id) ? "pp-card-selected" : ""}`,
      style: { cursor: "pointer", padding: 16, border: form.doctorId === (d._id || d.id) ? "2px solid var(--pp-blue)" : "1px solid var(--pp-border)" },
      onClick: () => setForm({ ...form, doctorId: d._id || d.id })
    },
    /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600 } }, "Dr. ", d.userId?.name || d.name),
    /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--pp-muted)" } }, d.specialty),
    /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, marginTop: 8, fontWeight: 600, color: "var(--pp-blue)" } }, d.consultFee, " XAF")
  ))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginTop: 24 } }, /* @__PURE__ */ React.createElement("button", { className: "pp-ghost-btn", onClick: () => setStep(1) }, "\u2190 Back"), /* @__PURE__ */ React.createElement("button", { className: "pp-btn pp-btn-primary", disabled: !form.doctorId, onClick: () => setStep(3) }, "Next Step \u2192"))), step === 3 && /* @__PURE__ */ React.createElement("div", { className: "pp-animate" }, /* @__PURE__ */ React.createElement("h3", { style: { marginBottom: 16 } }, "Date & Time"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "pp-label" }, "Date"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "pp-input", value: form.date, onChange: (e) => setForm({ ...form, date: e.target.value }) })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "pp-label" }, "Time"), /* @__PURE__ */ React.createElement("input", { type: "time", className: "pp-input", value: form.time, onChange: (e) => setForm({ ...form, time: e.target.value }) })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "pp-label" }, "Reason for visit"), /* @__PURE__ */ React.createElement("input", { type: "text", className: "pp-input", placeholder: "e.g. Toothache, Routine Checkup", value: form.notes, onChange: (e) => setForm({ ...form, notes: e.target.value }) })), form.type === "Home Visit" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "pp-label" }, "Home Address"), /* @__PURE__ */ React.createElement("input", { type: "text", className: "pp-input", placeholder: "Enter your full address", value: form.visitAddress, onChange: (e) => setForm({ ...form, visitAddress: e.target.value }) }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginTop: 24 } }, /* @__PURE__ */ React.createElement("button", { className: "pp-ghost-btn", onClick: () => setStep(2) }, "\u2190 Back"), /* @__PURE__ */ React.createElement("button", { className: "pp-btn pp-btn-primary", disabled: !form.date || !form.time || !form.notes || form.type === "Home Visit" && !form.visitAddress, onClick: () => {
    if (form.type === "Home Visit") setStep(4);
    else handleSubmit();
  } }, form.type === "Home Visit" ? "Proceed to Payment \u2192" : loading ? "Booking..." : "Confirm Booking"))), step === 4 && form.type === "Home Visit" && /* @__PURE__ */ React.createElement("div", { className: "pp-animate" }, /* @__PURE__ */ React.createElement("h3", { style: { marginBottom: 16 } }, "Payment Required"), /* @__PURE__ */ React.createElement("div", { style: { padding: 16, background: "var(--pp-bg)", borderRadius: 8, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("span", null, "Home Visit Fee"), /* @__PURE__ */ React.createElement("strong", null, doctors.find((d) => (d._id || d.id) === form.doctorId)?.consultFee || 15e3, " XAF")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", color: "var(--pp-muted)", fontSize: 12 } }, /* @__PURE__ */ React.createElement("span", null, "Travel Surcharge"), /* @__PURE__ */ React.createElement("span", null, "Included"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginTop: 24 } }, /* @__PURE__ */ React.createElement("button", { className: "pp-ghost-btn", onClick: () => setStep(3) }, "\u2190 Back"), /* @__PURE__ */ React.createElement("button", { className: "pp-btn pp-btn-primary", disabled: loading, onClick: handleSubmit }, loading ? "Processing..." : "Pay & Request Visit")))));
}
function PatConsultations({ consultations, onJoinCall, refresh, showToast }) {
  const handleUpdate2 = async (item, status) => {
    try {
      const isAppt = item.healthType !== void 0;
      const url = isAppt ? `/users/me/appointments/${item._id || item.id}/status` : `/users/me/consultations/${item._id || item.id}/status`;
      const finalStatus = isAppt ? status === "accepted" ? "CONFIRMED" : "CANCELLED" : status;
      await API.patch(url, { status: finalStatus });
      if (showToast) showToast(status === "accepted" ? "Accepted" : "Declined", "success");
      if (refresh) refresh();
    } catch (e) {
      if (showToast) showToast("Failed to update", "error");
    }
  };
  const handleDelete2 = async (item) => {
    if (!window.confirm("Delete this consultation?")) return;
    try {
      const isAppt = item.healthType !== void 0;
      const url = isAppt ? `/users/me/appointments/${item._id || item.id}` : `/users/me/consultations/${item._id || item.id}`;
      await API.delete(url);
      if (showToast) showToast("Deleted successfully", "success");
      if (refresh) refresh();
    } catch (e) {
      if (showToast) showToast("Failed to delete", "error");
    }
  };
  const navigate = useNavigate();
  return /* @__PURE__ */ React.createElement("div", { className: "pp-animate", style: { maxWidth: 900, margin: "0 auto" } }, /* @__PURE__ */ React.createElement("div", { className: "pp-page-hd", style: { marginBottom: 24 } }, /* @__PURE__ */ React.createElement("h1", { className: "pp-page-title" }, "Video Consultations"), /* @__PURE__ */ React.createElement("p", { className: "pp-page-sub" }, "Manage your online doctor visits")), /* @__PURE__ */ React.createElement("div", { className: "pp-card" }, !consultations || consultations.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { padding: 40, textAlign: "center", color: "var(--pp-muted)" } }, "No video consultations scheduled.") : /* @__PURE__ */ React.createElement("table", { className: "pp-table", style: { width: "100%", borderCollapse: "collapse" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { borderBottom: "1px solid var(--pp-border)", textAlign: "left" } }, /* @__PURE__ */ React.createElement("th", { style: { padding: 16 } }, "Doctor"), /* @__PURE__ */ React.createElement("th", { style: { padding: 16 } }, "Date & Time"), /* @__PURE__ */ React.createElement("th", { style: { padding: 16 } }, "Status"), /* @__PURE__ */ React.createElement("th", { style: { padding: 16, textAlign: "right" } }, "Action"))), /* @__PURE__ */ React.createElement("tbody", null, consultations.map((c2) => /* @__PURE__ */ React.createElement("tr", { key: c2._id || c2.id, style: { borderBottom: "1px solid var(--pp-border)" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: 16, fontWeight: 600 } }, "Dr. ", c2.doctorId?.userId?.name || c2.doctorName || "Unknown"), /* @__PURE__ */ React.createElement("td", { style: { padding: 16 } }, new Date(c2.date).toLocaleDateString(), " at ", c2.time), /* @__PURE__ */ React.createElement("td", { style: { padding: 16 } }, /* @__PURE__ */ React.createElement("span", { style: { padding: "4px 8px", borderRadius: 12, fontSize: 12, background: c2.status === "APPROVED" ? "#e6f4ea" : "#fef7e0", color: c2.status === "APPROVED" ? "#137333" : "#b06000", fontWeight: 600 } }, c2.status)), /* @__PURE__ */ React.createElement("td", { style: { padding: 16, textAlign: "right" } }, /* @__PURE__ */ React.createElement("button", { className: "pp-ghost-btn", style: { color: "red", marginRight: 10 }, onClick: () => handleDelete2(c2) }, "Delete"), c2.status?.toLowerCase() === "pending" && /* @__PURE__ */ React.createElement("div", { style: { display: "inline-flex", gap: 6, marginRight: 10 } }, /* @__PURE__ */ React.createElement("button", { className: "pp-btn", style: { background: "#e6f4ea", color: "#137333", padding: "6px 12px", fontSize: 13 }, onClick: () => handleUpdate2(c2, "accepted") }, "Accept"), /* @__PURE__ */ React.createElement("button", { className: "pp-btn", style: { background: "#fce8e6", color: "#c5221f", padding: "6px 12px", fontSize: 13 }, onClick: () => handleUpdate2(c2, "declined") }, "Reject")), /* @__PURE__ */ React.createElement("button", { className: "pp-btn pp-btn-primary", disabled: !["APPROVED", "CONFIRMED", "SCHEDULED", "ACCEPTED"].includes(c2.status?.toUpperCase()), onClick: () => onJoinCall(c2.roomId || c2._id || c2.id) }, "Join Call ", /* @__PURE__ */ React.createElement("i", { className: "ti ti-video", style: { marginLeft: 8 } })))))))));
}
function PatHomeVisit({ homeVisits }) {
  const navigate = useNavigate();
  return /* @__PURE__ */ React.createElement("div", { className: "pp-animate", style: { maxWidth: 900, margin: "0 auto" } }, /* @__PURE__ */ React.createElement("div", { className: "pp-page-hd", style: { marginBottom: 24 } }, /* @__PURE__ */ React.createElement("h1", { className: "pp-page-title" }, "Home Visits"), /* @__PURE__ */ React.createElement("p", { className: "pp-page-sub" }, "Track your requested home visits")), /* @__PURE__ */ React.createElement("div", { className: "pp-card" }, !homeVisits || homeVisits.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { padding: 40, textAlign: "center", color: "var(--pp-muted)" } }, "No home visits requested.") : /* @__PURE__ */ React.createElement("table", { className: "pp-table", style: { width: "100%", borderCollapse: "collapse" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { borderBottom: "1px solid var(--pp-border)", textAlign: "left" } }, /* @__PURE__ */ React.createElement("th", { style: { padding: 16 } }, "Doctor"), /* @__PURE__ */ React.createElement("th", { style: { padding: 16 } }, "Date & Time"), /* @__PURE__ */ React.createElement("th", { style: { padding: 16 } }, "Address"), /* @__PURE__ */ React.createElement("th", { style: { padding: 16 } }, "Status"), /* @__PURE__ */ React.createElement("th", { style: { padding: 16, textAlign: "right" } }, "Action"))), /* @__PURE__ */ React.createElement("tbody", null, homeVisits.map((h) => /* @__PURE__ */ React.createElement("tr", { key: h._id || h.id, style: { borderBottom: "1px solid var(--pp-border)" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: 16, fontWeight: 600 } }, "Dr. ", h.doctorId?.userId?.name || h.doctorName || "Unknown"), /* @__PURE__ */ React.createElement("td", { style: { padding: 16 } }, new Date(h.date).toLocaleDateString(), " at ", h.time), /* @__PURE__ */ React.createElement("td", { style: { padding: 16, maxWidth: 150, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, h.visitAddress), /* @__PURE__ */ React.createElement("td", { style: { padding: 16 } }, /* @__PURE__ */ React.createElement("span", { style: { padding: "4px 8px", borderRadius: 12, fontSize: 12, background: h.status === "APPROVED" ? "#e6f4ea" : "#fef7e0", color: h.status === "APPROVED" ? "#137333" : "#b06000", fontWeight: 600 } }, h.status)), /* @__PURE__ */ React.createElement("td", { style: { padding: 16, textAlign: "right" } }, /* @__PURE__ */ React.createElement("button", { className: "pp-ghost-btn", style: { color: "red", marginRight: 10 }, onClick: () => handleDelete(c._id || c.id) }, "Delete"), /* @__PURE__ */ React.createElement("button", { className: "pp-btn pp-btn-primary", onClick: () => navigate(`/livemap?trackingId=${h.trackingId || h._id}`) }, "Live Map ", /* @__PURE__ */ React.createElement("i", { className: "ti ti-map-pin", style: { marginLeft: 8 } })))))))));
}
function PatPrescriptions({ prescriptions, user, refresh, showToast }) {
  const handleDelete2 = async (id) => {
    if (!window.confirm("Delete this prescription?")) return;
    try {
      await API.delete(`/users/me/prescriptions/${id}`);
      if (showToast) showToast("Deleted successfully", "success");
      if (refresh) refresh();
    } catch (e) {
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
        <div class="info"><div>Patient: ${pName}</div><div>Date: ${presc.createdAt ? new Date(presc.createdAt).toISOString().split("T")[0] : presc.date}</div></div>
        ${presc.diagnosis ? `<p><strong>Diagnosis:</strong> ${presc.diagnosis}</p>` : ""}
        <table><thead><tr><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr></thead><tbody>
          ${presc.medicines && presc.medicines.length > 0 ? presc.medicines.map((m) => `<tr><td><strong>${m.name}</strong></td><td>${m.dosage || "-"}</td><td>${m.frequency || "-"}</td><td>${m.duration || "-"}</td></tr>`).join("") : `<tr><td><strong>${presc.medication}</strong></td><td>${presc.dosage || "-"}</td><td>-</td><td>${presc.duration || "-"}</td></tr>`}
        </tbody></table>
        ${presc.notes ? `<div style="margin-top: 20px;"><h3>Clinical Notes</h3><p>${presc.notes}</p></div>` : ""}
        <div style="margin-top: 60px; text-align: right;"><div>___________________________</div><div style="margin-top: 8px;">Doctor's Signature</div></div>
      </body></html>`;
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 250);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "pp-animate", style: { maxWidth: 900, margin: "0 auto" } }, /* @__PURE__ */ React.createElement("div", { className: "pp-page-hd", style: { marginBottom: 24 } }, /* @__PURE__ */ React.createElement("h1", { className: "pp-page-title" }, "Prescriptions"), /* @__PURE__ */ React.createElement("p", { className: "pp-page-sub" }, "Active and past medications")), /* @__PURE__ */ React.createElement("div", { className: "pp-card" }, !prescriptions || prescriptions.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { padding: 40, textAlign: "center", color: "var(--pp-muted)" } }, "No prescriptions found.") : /* @__PURE__ */ React.createElement("div", { className: "pp-tbl-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "pp-table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { style: { padding: "12px 16px" } }, "Medications"), /* @__PURE__ */ React.createElement("th", { style: { padding: "12px 16px" } }, "Diagnosis"), /* @__PURE__ */ React.createElement("th", { style: { padding: "12px 16px" } }, "Doctor"), /* @__PURE__ */ React.createElement("th", { style: { padding: "12px 16px" } }, "Date"), /* @__PURE__ */ React.createElement("th", { style: { padding: "12px 16px" } }, "Action"))), /* @__PURE__ */ React.createElement("tbody", null, prescriptions.map((p) => /* @__PURE__ */ React.createElement("tr", { key: p.id || p._id }, /* @__PURE__ */ React.createElement("td", { style: { padding: 16 } }, Array.isArray(p.medicines) && p.medicines.length > 0 ? p.medicines.map((m) => m.name).join(", ") : p.medication || "-"), /* @__PURE__ */ React.createElement("td", { style: { padding: 16 } }, p.diagnosis || "-"), /* @__PURE__ */ React.createElement("td", { style: { padding: 16 } }, "Dr. ", p.doctorName), /* @__PURE__ */ React.createElement("td", { style: { padding: 16 } }, p.createdAt ? new Date(p.createdAt).toISOString().split("T")[0] : p.date), /* @__PURE__ */ React.createElement("td", { style: { padding: 16 } }, /* @__PURE__ */ React.createElement("button", { className: "pp-btn-primary", style: { padding: "6px 12px", fontSize: 13 }, onClick: () => setSelected(p) }, "View & Print")))))))), selected && /* @__PURE__ */ React.createElement(Modal, { title: "Prescription Details", onClose: () => setSelected(null) }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { style: { margin: 0, fontSize: 20, color: "var(--pp-dark)" } }, "Dr. ", selected.doctorName), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--pp-muted)", marginTop: 4 } }, "Date: ", selected.createdAt ? new Date(selected.createdAt).toISOString().split("T")[0] : selected.date)), /* @__PURE__ */ React.createElement("button", { className: "pp-btn-primary", onClick: () => printPresc(selected) }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-printer", style: { marginRight: 6 } }), " Print A4")), selected.diagnosis && /* @__PURE__ */ React.createElement("div", { style: { background: "#f8fafc", padding: 12, borderRadius: 8, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("strong", null, "Diagnosis / Condition:"), " ", selected.diagnosis), /* @__PURE__ */ React.createElement("h3", { style: { fontSize: 15, marginBottom: 8, borderBottom: "1px solid #e2e8f0", paddingBottom: 4 } }, "Medications"), /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "#f8fafc" } }, /* @__PURE__ */ React.createElement("th", { style: { padding: 8, textAlign: "left", borderBottom: "1px solid #e2e8f0" } }, "Medication"), /* @__PURE__ */ React.createElement("th", { style: { padding: 8, textAlign: "left", borderBottom: "1px solid #e2e8f0" } }, "Dosage"), /* @__PURE__ */ React.createElement("th", { style: { padding: 8, textAlign: "left", borderBottom: "1px solid #e2e8f0" } }, "Frequency"), /* @__PURE__ */ React.createElement("th", { style: { padding: 8, textAlign: "left", borderBottom: "1px solid #e2e8f0" } }, "Duration"))), /* @__PURE__ */ React.createElement("tbody", null, selected.medicines && selected.medicines.length > 0 ? selected.medicines.map((m, i) => /* @__PURE__ */ React.createElement("tr", { key: i }, /* @__PURE__ */ React.createElement("td", { style: { padding: 8, borderBottom: "1px solid #e2e8f0", fontWeight: "bold" } }, m.name), /* @__PURE__ */ React.createElement("td", { style: { padding: 8, borderBottom: "1px solid #e2e8f0" } }, m.dosage || "-"), /* @__PURE__ */ React.createElement("td", { style: { padding: 8, borderBottom: "1px solid #e2e8f0" } }, m.frequency || "-"), /* @__PURE__ */ React.createElement("td", { style: { padding: 8, borderBottom: "1px solid #e2e8f0" } }, m.duration || "-"))) : /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: { padding: 8, borderBottom: "1px solid #e2e8f0", fontWeight: "bold" } }, selected.medication), /* @__PURE__ */ React.createElement("td", { style: { padding: 8, borderBottom: "1px solid #e2e8f0" } }, selected.dosage || "-"), /* @__PURE__ */ React.createElement("td", { style: { padding: 8, borderBottom: "1px solid #e2e8f0" } }, "-"), /* @__PURE__ */ React.createElement("td", { style: { padding: 8, borderBottom: "1px solid #e2e8f0" } }, selected.duration || "-")))), selected.notes && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("h3", { style: { fontSize: 15, marginBottom: 8, borderBottom: "1px solid #e2e8f0", paddingBottom: 4 } }, "Clinical Notes"), /* @__PURE__ */ React.createElement("p", { style: { margin: 0, fontSize: 14, color: "var(--pp-dark)", lineHeight: 1.5 } }, selected.notes))));
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
            ${r.vitals.bp ? `<div><small>Blood Pressure</small><br/><strong>${r.vitals.bp}</strong></div>` : ""}
            ${r.vitals.hr ? `<div><small>Heart Rate</small><br/><strong>${r.vitals.hr}</strong></div>` : ""}
            ${r.vitals.temp ? `<div><small>Temperature</small><br/><strong>${r.vitals.temp}</strong></div>` : ""}
            ${r.vitals.weight ? `<div><small>Weight</small><br/><strong>${r.vitals.weight}</strong></div>` : ""}
          </div></div>` : ""}
        ${r.symptoms ? `<div class="section"><h3>Symptoms</h3><p>${r.symptoms}</p></div>` : ""}
        ${r.treatmentPlan ? `<div class="section"><h3>Treatment Plan</h3><p>${r.treatmentPlan}</p></div>` : ""}
        ${r.attachment ? `<div class="section"><h3>Attachment</h3><br/><img src="${r.attachment}" style="max-width: 100%; max-height: 400px; border-radius: 8px;"/></div>` : ""}
      </body></html>`;
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 250);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "pp-animate", style: { maxWidth: 900, margin: "0 auto" } }, /* @__PURE__ */ React.createElement("div", { className: "pp-page-hd", style: { marginBottom: 24 } }, /* @__PURE__ */ React.createElement("h1", { className: "pp-page-title" }, "Medical Records"), /* @__PURE__ */ React.createElement("p", { className: "pp-page-sub" }, "Your complete health history and reports")), /* @__PURE__ */ React.createElement("div", { className: "pp-card", style: { padding: 24 } }, !records || records.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { padding: 40, textAlign: "center", color: "var(--pp-muted)" } }, "No medical records found.") : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } }, records.map((r) => /* @__PURE__ */ React.createElement("div", { key: r.id || r._id, onClick: () => setSelected(r), style: { cursor: "pointer", display: "flex", gap: 16, padding: "16px", borderRadius: 8, border: "1px solid var(--pp-border)", transition: "0.2s", ":hover": { background: "#f8fafc" } } }, /* @__PURE__ */ React.createElement("div", { style: { width: 48, height: 48, borderRadius: 8, background: "rgba(30, 136, 229, 0.1)", color: "var(--pp-blue)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 } }, /* @__PURE__ */ React.createElement("i", { className: `ti ${r.type === "imaging" ? "ti-photo" : r.type === "lab" ? "ti-flask" : "ti-file-description"}` })), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 16, color: "var(--pp-dark)" } }, r.title), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--pp-muted)", background: "var(--pp-bg)", padding: "4px 8px", borderRadius: 12, textTransform: "capitalize", fontWeight: 600 } }, r.type)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--pp-dark)", opacity: 0.8, marginBottom: 8 } }, "Dr. ", r.doctorName, " \u2022 ", r.date), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: "var(--pp-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "500px" } }, r.description), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--pp-blue)", marginTop: 8, fontWeight: 600 } }, "Click to view full record \u2192")))))), selected && /* @__PURE__ */ React.createElement(Modal, { title: "Medical Record", onClose: () => setSelected(null) }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { style: { margin: 0, fontSize: 20, color: "var(--pp-dark)" } }, selected.title), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--pp-muted)", marginTop: 4 } }, "Dr. ", selected.doctorName, " \u2022 ", selected.date)), /* @__PURE__ */ React.createElement("button", { className: "pp-btn-primary", onClick: () => printRecord(selected) }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-printer", style: { marginRight: 6 } }), " Print A4")), /* @__PURE__ */ React.createElement("div", { style: { background: "#f8fafc", padding: 12, borderRadius: 8, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("strong", null, "Type:"), " ", /* @__PURE__ */ React.createElement("span", { style: { textTransform: "capitalize" } }, selected.type)), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("h3", { style: { fontSize: 15, marginBottom: 8, borderBottom: "1px solid #e2e8f0", paddingBottom: 4 } }, "Clinical Notes"), /* @__PURE__ */ React.createElement("p", { style: { margin: 0, fontSize: 14, color: "var(--pp-dark)", lineHeight: 1.5 } }, selected.description)), selected.vitals && (selected.vitals.bp || selected.vitals.hr || selected.vitals.temp || selected.vitals.weight) && /* @__PURE__ */ React.createElement("div", { style: { background: "#f8fafc", padding: "12px", borderRadius: 8, marginBottom: 16, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 } }, selected.vitals.bp && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { color: "#64748b", fontSize: 11, display: "block" } }, "Blood Pressure"), /* @__PURE__ */ React.createElement("strong", { style: { fontSize: 13, color: "#0f172a" } }, selected.vitals.bp)), selected.vitals.hr && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { color: "#64748b", fontSize: 11, display: "block" } }, "Heart Rate"), /* @__PURE__ */ React.createElement("strong", { style: { fontSize: 13, color: "#0f172a" } }, selected.vitals.hr)), selected.vitals.temp && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { color: "#64748b", fontSize: 11, display: "block" } }, "Temperature"), /* @__PURE__ */ React.createElement("strong", { style: { fontSize: 13, color: "#0f172a" } }, selected.vitals.temp)), selected.vitals.weight && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { color: "#64748b", fontSize: 11, display: "block" } }, "Weight"), /* @__PURE__ */ React.createElement("strong", { style: { fontSize: 13, color: "#0f172a" } }, selected.vitals.weight))), selected.symptoms && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("h3", { style: { fontSize: 15, marginBottom: 4, borderBottom: "1px solid #e2e8f0", paddingBottom: 4 } }, "Symptoms"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, color: "var(--pp-dark)" } }, selected.symptoms)), selected.treatmentPlan && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("h3", { style: { fontSize: 15, marginBottom: 4, borderBottom: "1px solid #e2e8f0", paddingBottom: 4 } }, "Treatment Plan"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, color: "var(--pp-dark)" } }, selected.treatmentPlan)), selected.attachment && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { style: { fontSize: 15, marginBottom: 8, borderBottom: "1px solid #e2e8f0", paddingBottom: 4 } }, "Attachment"), /* @__PURE__ */ React.createElement("img", { src: selected.attachment, alt: "Attachment", style: { maxHeight: 300, borderRadius: 8, objectFit: "cover", border: "1px solid #e2e8f0" } }))));
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
          <tr><td>${p.service}</td><td>${p.method || "Cash"}</td><td>${p.status}</td><td>${p.amount} FCFA</td></tr>
        </tbody></table>
        <div class="total">Total Paid: ${p.amount} FCFA</div>
        <div style="margin-top: 60px; text-align: center; color: #64748b; font-size: 13px;">Thank you for choosing ToothEase Clinic!</div>
      </body></html>`;
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 250);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "pp-animate", style: { maxWidth: 900, margin: "0 auto" } }, /* @__PURE__ */ React.createElement("div", { className: "pp-page-hd", style: { marginBottom: 24 } }, /* @__PURE__ */ React.createElement("h1", { className: "pp-page-title" }, "Payments & Invoices"), /* @__PURE__ */ React.createElement("p", { className: "pp-page-sub" }, "View your billing history")), /* @__PURE__ */ React.createElement("div", { className: "pp-card" }, !payments || payments.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { padding: 40, textAlign: "center", color: "var(--pp-muted)" } }, "No payments found.") : /* @__PURE__ */ React.createElement("div", { className: "pp-tbl-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "pp-table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { style: { padding: "12px 16px" } }, "Service"), /* @__PURE__ */ React.createElement("th", { style: { padding: "12px 16px" } }, "Doctor"), /* @__PURE__ */ React.createElement("th", { style: { padding: "12px 16px" } }, "Amount"), /* @__PURE__ */ React.createElement("th", { style: { padding: "12px 16px" } }, "Method"), /* @__PURE__ */ React.createElement("th", { style: { padding: "12px 16px" } }, "Date"), /* @__PURE__ */ React.createElement("th", { style: { padding: "12px 16px" } }, "Action"))), /* @__PURE__ */ React.createElement("tbody", null, payments.map((p) => /* @__PURE__ */ React.createElement("tr", { key: p.id || p._id }, /* @__PURE__ */ React.createElement("td", { style: { padding: 16 } }, p.service), /* @__PURE__ */ React.createElement("td", { style: { padding: 16 } }, "Dr. ", p.doctorName), /* @__PURE__ */ React.createElement("td", { style: { padding: 16, fontWeight: 700 } }, p.amount, " FCFA"), /* @__PURE__ */ React.createElement("td", { style: { padding: 16 } }, p.method || "Cash"), /* @__PURE__ */ React.createElement("td", { style: { padding: 16 } }, p.date), /* @__PURE__ */ React.createElement("td", { style: { padding: 16 } }, /* @__PURE__ */ React.createElement("button", { className: "pp-btn-primary", style: { padding: "6px 12px", fontSize: 13 }, onClick: () => printInvoice(p) }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-printer", style: { marginRight: 6 } }), " Print")))))))));
}
function PatMessages({ showToast }) {
  const [contacts, setContacts] = React.useState([]);
  const [selId, setSelId] = React.useState("admin");
  const [msgs, setMsgs] = React.useState([]);
  const [msgText, setMsgText] = React.useState("");
  const endRef = React.useRef(null);
  React.useEffect(() => {
    API.get("/doctors").then((r) => {
      if (r.data.success) {
        setContacts([
          { id: "admin", name: "Administrator", role: "Support Team" },
          ...r.data.doctors.map((d) => ({
            id: d.user?._id || d.id || d._id,
            name: d.name,
            role: d.specialty || "Doctor",
            avatar: d.user?.avatar
          }))
        ]);
      }
    }).catch(() => {
    });
  }, []);
  const load = React.useCallback(async () => {
    if (!selId) return;
    try {
      const r = await API.get(`/messages/${selId}`);
      if (r.data.success) setMsgs(r.data.messages);
    } catch {
    }
  }, [selId]);
  React.useEffect(() => {
    load();
  }, [selId, load]);
  React.useEffect(() => {
    const t = setInterval(load, 2e3);
    return () => clearInterval(t);
  }, [load]);
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);
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
  const selContact = contacts.find((c2) => c2.id === selId);
  return /* @__PURE__ */ React.createElement("div", { className: "pp-animate", style: { display: "flex", flexDirection: "column", height: "calc(100vh - 180px)", background: "#fff", borderRadius: 16, border: "1px solid var(--pp-border)", overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "20px 24px", borderBottom: "1px solid var(--pp-border)", background: "var(--pp-bg)" } }, /* @__PURE__ */ React.createElement("h2", { style: { margin: 0, fontSize: 18, color: "var(--pp-dark)" } }, "Messages")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flex: 1, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 280, borderRight: "1px solid var(--pp-border)", overflowY: "auto", background: "var(--pp-bg)" } }, contacts.map((c2) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: c2.id,
      onClick: () => setSelId(c2.id),
      style: { display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", cursor: "pointer", borderBottom: "1px solid var(--pp-border)", background: selId === c2.id ? "#fff" : "transparent", borderLeft: selId === c2.id ? "4px solid var(--pp-blue)" : "4px solid transparent" }
    },
    /* @__PURE__ */ React.createElement("div", { style: { width: 40, height: 40, borderRadius: "50%", background: "var(--pp-blue)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 } }, c2.avatar ? /* @__PURE__ */ React.createElement("img", { src: c2.avatar, style: { width: "100%", height: "100%", borderRadius: "50%" }, alt: "" }) : c2.name.charAt(0).toUpperCase()),
    /* @__PURE__ */ React.createElement("div", { style: { overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 14, color: "var(--pp-dark)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, c2.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--pp-muted)" } }, c2.role))
  ))), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", background: "#fff" } }, selContact && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { padding: "16px 24px", borderBottom: "1px solid var(--pp-border)", display: "flex", alignItems: "center", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 16, color: "var(--pp-dark)" } }, selContact.name)), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16, background: "#f8fafc" } }, msgs.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", color: "var(--pp-muted)", marginTop: 40 } }, "No messages yet. Say hello!"), msgs.map((m) => {
    const isMe = m.from === "patient";
    return /* @__PURE__ */ React.createElement("div", { key: m.id, style: { alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "75%" } }, /* @__PURE__ */ React.createElement("div", { style: { background: isMe ? "var(--pp-blue)" : "#fff", color: isMe ? "#fff" : "var(--pp-dark)", padding: "12px 16px", borderRadius: 16, borderBottomRightRadius: isMe ? 4 : 16, borderBottomLeftRadius: isMe ? 16 : 4, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", fontSize: 14, lineHeight: 1.5, border: isMe ? "none" : "1px solid var(--pp-border)" } }, m.text), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--pp-muted)", marginTop: 6, textAlign: isMe ? "right" : "left" } }, m.ts));
  }), /* @__PURE__ */ React.createElement("div", { ref: endRef })), /* @__PURE__ */ React.createElement("div", { style: { padding: 20, borderTop: "1px solid var(--pp-border)", display: "flex", gap: 12, background: "#fff" } }, /* @__PURE__ */ React.createElement("input", { className: "pp-input", style: { flex: 1, margin: 0, background: "var(--pp-bg)" }, placeholder: "Type your message...", value: msgText, onChange: (e) => setMsgText(e.target.value), onKeyDown: (e) => e.key === "Enter" && send() }), /* @__PURE__ */ React.createElement("button", { className: "pp-btn pp-btn-primary", style: { padding: "0 24px" }, onClick: send }, "Send ", /* @__PURE__ */ React.createElement("i", { className: "ti ti-send", style: { marginLeft: 8 } })))))));
}
function PatNotifications({ notifications, toast, refresh }) {
  const clearAll = async () => {
    if (!window.confirm("Clear all notifications?")) return;
    try {
      await API.delete("/users/me/notifications/clear");
      toast("Cleared");
      refresh();
    } catch {
    }
  };
  const del = async (id) => {
    try {
      await API.delete(`/users/me/notifications/${id}`);
      refresh();
    } catch {
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "pp-animate", style: { maxWidth: 800, margin: "0 auto" } }, /* @__PURE__ */ React.createElement("div", { className: "pp-page-hd", style: { marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "pp-page-title" }, "Notifications"), /* @__PURE__ */ React.createElement("p", { className: "pp-page-sub" }, "Alerts and updates")), notifications?.length > 0 && /* @__PURE__ */ React.createElement("button", { className: "pp-btn-outline", style: { color: "#ef4444", borderColor: "#ef4444" }, onClick: clearAll }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-trash", style: { marginRight: 6 } }), " Clear All")), /* @__PURE__ */ React.createElement("div", { className: "pp-card", style: { padding: 0 } }, (!notifications || notifications.length === 0) && /* @__PURE__ */ React.createElement("div", { style: { padding: 40, textAlign: "center", color: "var(--pp-muted)" } }, "No new notifications."), notifications?.map((n) => /* @__PURE__ */ React.createElement("div", { key: n.id || n._id, style: { display: "flex", gap: 14, padding: "16px 20px", borderBottom: "1px solid var(--pp-border)", alignItems: "flex-start" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 40, height: 40, borderRadius: "50%", background: "rgba(30, 136, 229, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--pp-blue)", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-bell", style: { fontSize: 20 } })), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 15, color: "var(--pp-dark)" } }, n.title), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: "var(--pp-muted)", marginTop: 4, lineHeight: 1.5 } }, n.body)), /* @__PURE__ */ React.createElement("button", { className: "pp-icon-btn", style: { color: "#ef4444", flexShrink: 0 }, onClick: () => del(n.id || n._id) }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-x" }))))));
}
function PatProfile({ patient, toast, refresh }) {
  const [f, setF] = useState({
    name: patient?.name || "",
    email: patient?.email || "",
    phone: patient?.phone || "",
    dob: patient?.dob ? new Date(patient?.dob).toISOString().split("T")[0] : "",
    country: patient?.country || "Cameroon",
    address: patient?.address || "",
    bloodType: patient?.bloodType || "",
    allergies: patient?.allergies || "",
    emergency: patient?.emergency || "",
    avatar: patient?.avatar || ""
  });
  useEffect(() => {
    if (patient) {
      setF({
        name: patient.name || "",
        email: patient.email || "",
        phone: patient.phone || "",
        dob: patient.dob ? new Date(patient.dob).toISOString().split("T")[0] : "",
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
    if (!window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) return;
    try {
      await API.delete("/users/me");
      toast("Account deleted. Logging out...");
      setTimeout(() => {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }, 1500);
    } catch {
      toast("Failed to delete account", "error");
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "pp-animate", style: { maxWidth: 800, margin: "0 auto" } }, /* @__PURE__ */ React.createElement("div", { className: "pp-page-hd", style: { marginBottom: 24 } }, /* @__PURE__ */ React.createElement("h1", { className: "pp-page-title" }, "My Profile"), /* @__PURE__ */ React.createElement("p", { className: "pp-page-sub" }, "Manage your personal information")), /* @__PURE__ */ React.createElement("div", { className: "pp-card", style: { padding: "30px 24px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 30 } }, /* @__PURE__ */ React.createElement("div", { style: { position: "relative", marginBottom: 16 } }, f.avatar ? /* @__PURE__ */ React.createElement("img", { src: f.avatar, style: { width: 120, height: 120, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--pp-border)", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" } }) : /* @__PURE__ */ React.createElement(Avatar, { name: f.name || "User", size: 120 }), /* @__PURE__ */ React.createElement("label", { style: { position: "absolute", bottom: 0, right: 10, background: "var(--pp-blue)", color: "#fff", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2px solid #fff", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" } }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-camera" }), /* @__PURE__ */ React.createElement("input", { type: "file", accept: "image/*", style: { display: "none" }, onChange: handleImageUpload })), f.avatar && /* @__PURE__ */ React.createElement("div", { onClick: removeImage, style: { position: "absolute", bottom: 0, left: 10, background: "#ef4444", color: "#fff", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2px solid #fff", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }, title: "Remove Avatar" }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-trash", style: { fontSize: 16 } }))), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 20, color: "var(--pp-dark)" } }, f.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: "var(--pp-muted)" } }, f.email)), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 24px" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 13, fontWeight: 600, color: "var(--pp-dark)", marginBottom: 8 } }, "Full Name"), /* @__PURE__ */ React.createElement("input", { className: "pp-input", value: f.name, onChange: (e) => setF({ ...f, name: e.target.value }) })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 13, fontWeight: 600, color: "var(--pp-dark)", marginBottom: 8 } }, "Email Address"), /* @__PURE__ */ React.createElement("input", { className: "pp-input", value: f.email, disabled: true, style: { background: "#f8fafc", cursor: "not-allowed" } })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 13, fontWeight: 600, color: "var(--pp-dark)", marginBottom: 8 } }, "Phone Number"), /* @__PURE__ */ React.createElement("input", { className: "pp-input", value: f.phone, onChange: (e) => setF({ ...f, phone: e.target.value }), placeholder: "+237..." })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 13, fontWeight: 600, color: "var(--pp-dark)", marginBottom: 8 } }, "Date of Birth"), /* @__PURE__ */ React.createElement("input", { className: "pp-input", type: "date", value: f.dob, onChange: (e) => setF({ ...f, dob: e.target.value }) })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 13, fontWeight: 600, color: "var(--pp-dark)", marginBottom: 8 } }, "Country"), /* @__PURE__ */ React.createElement("input", { className: "pp-input", value: f.country, onChange: (e) => setF({ ...f, country: e.target.value }) })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 13, fontWeight: 600, color: "var(--pp-dark)", marginBottom: 8 } }, "Home Address"), /* @__PURE__ */ React.createElement("input", { className: "pp-input", value: f.address, onChange: (e) => setF({ ...f, address: e.target.value }), placeholder: "City, Street..." }))), /* @__PURE__ */ React.createElement("div", { style: { height: 1, background: "var(--pp-border)", margin: "30px 0" } }), /* @__PURE__ */ React.createElement("h3", { style: { fontSize: 16, fontWeight: 700, color: "var(--pp-dark)", marginBottom: 20 } }, "Medical Information"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 24px" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 13, fontWeight: 600, color: "var(--pp-dark)", marginBottom: 8 } }, "Blood Type"), /* @__PURE__ */ React.createElement("select", { className: "pp-input", value: f.bloodType, onChange: (e) => setF({ ...f, bloodType: e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Select..."), /* @__PURE__ */ React.createElement("option", null, "A+"), /* @__PURE__ */ React.createElement("option", null, "A-"), /* @__PURE__ */ React.createElement("option", null, "B+"), /* @__PURE__ */ React.createElement("option", null, "B-"), /* @__PURE__ */ React.createElement("option", null, "O+"), /* @__PURE__ */ React.createElement("option", null, "O-"), /* @__PURE__ */ React.createElement("option", null, "AB+"), /* @__PURE__ */ React.createElement("option", null, "AB-"))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 13, fontWeight: 600, color: "var(--pp-dark)", marginBottom: 8 } }, "Emergency Contact"), /* @__PURE__ */ React.createElement("input", { className: "pp-input", value: f.emergency, onChange: (e) => setF({ ...f, emergency: e.target.value }), placeholder: "Name / Phone" })), /* @__PURE__ */ React.createElement("div", { style: { gridColumn: "1 / -1" } }, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 13, fontWeight: 600, color: "var(--pp-dark)", marginBottom: 8 } }, "Allergies / Existing Conditions"), /* @__PURE__ */ React.createElement("textarea", { className: "pp-input", style: { height: 80, resize: "vertical" }, value: f.allergies, onChange: (e) => setF({ ...f, allergies: e.target.value }), placeholder: "List any known allergies..." }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40 } }, /* @__PURE__ */ React.createElement("button", { className: "pp-btn-outline", style: { color: "#ef4444", borderColor: "#ef4444" }, onClick: delAccount }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-trash" }), " Delete Account"), /* @__PURE__ */ React.createElement("button", { className: "pp-btn-primary", style: { padding: "12px 30px", fontSize: 15 }, onClick: save }, "Save Profile"))));
}
function PatMyChart({ dentalRecords }) {
  return /* @__PURE__ */ React.createElement("div", { className: "pp-animate", style: { maxWidth: 900, margin: "0 auto" } }, /* @__PURE__ */ React.createElement("div", { className: "pp-page-hd", style: { marginBottom: 24 } }, /* @__PURE__ */ React.createElement("h1", { className: "pp-page-title" }, "My 3D Dental Chart"), /* @__PURE__ */ React.createElement("p", { className: "pp-page-sub" }, "Interactive view of your oral health")), /* @__PURE__ */ React.createElement(DentalChart, { records: dentalRecords, readOnly: true }));
}
