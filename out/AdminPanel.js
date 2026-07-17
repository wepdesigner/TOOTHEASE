import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import "./Styles/Admin.css";
import AdminMemberships from "./AdminMemberships";
const uid = () => Math.random().toString(36).slice(2, 10).toUpperCase();
const now = () => (/* @__PURE__ */ new Date()).toISOString();
const COMMISSION_PCT = 12;
function Av({ name = "?", size = 36 }) {
  const colors = ["#1e88e5", "#00bfa5", "#7c3aed", "#f44336", "#ff7043", "#0d47a1", "#00838f"];
  const idx = (name.charCodeAt(0) || 0) % colors.length;
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return /* @__PURE__ */ React.createElement("div", { style: {
    width: size,
    height: size,
    borderRadius: "50%",
    background: colors[idx],
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: size * 0.36,
    flexShrink: 0,
    fontFamily: "'Sora',sans-serif",
    boxShadow: "0 2px 8px rgba(0,0,0,.18)"
  } }, initials);
}
function Badge({ label }) {
  let bg = "#f1f5f9", c = "#475569";
  const s = String(label).toLowerCase();
  if (s === "active" || s === "confirmed" || s === "paid" || s === "completed") {
    bg = "#dcfce7";
    c = "#16a34a";
  }
  if (s === "pending") {
    bg = "#fef3c7";
    c = "#d97706";
  }
  if (s === "suspended" || s === "cancelled" || s === "failed") {
    bg = "#fee2e2";
    c = "#dc2626";
  }
  return /* @__PURE__ */ React.createElement("span", { style: { background: bg, color: c, padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, textTransform: "capitalize" } }, label);
}
function Modal({ title, onClose, children, width = 400 }) {
  return /* @__PURE__ */ React.createElement("div", { className: "modal-backdrop" }, /* @__PURE__ */ React.createElement("div", { className: "modal-content page-anim", style: { width, maxWidth: "90vw" } }, /* @__PURE__ */ React.createElement("div", { className: "modal-head" }, /* @__PURE__ */ React.createElement("h3", { style: { margin: 0, fontSize: 18 } }, title), /* @__PURE__ */ React.createElement("button", { className: "ghost-btn", style: { padding: "6px 12px" }, onClick: onClose }, "\u2715")), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, children)));
}
function FRow({ label, children }) {
  return /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("label", { style: { display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "var(--muted)" } }, label), children);
}
const inp = { width: "100%", padding: "10px 14px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
function useToast() {
  const [list, setList] = useState([]);
  const fire = (msg, type = "success") => {
    const id = uid();
    setList((l) => [...l, { id, msg, type }]);
    setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), 4e3);
  };
  return { list, fire };
}
function AdminOverview({ onNav, toast }) {
  const [stats, setStats] = useState({ totalPatients: 0, totalDoctors: 0, activeDoctors: 0, pendingAppointments: 0, totalAppointments: 0, totalRevenue: 0 });
  const [recent, setRecent] = useState([]);
  useEffect(() => {
    API.get("/admin/overview").then((res) => {
      if (res.data.success) {
        setStats(res.data.stats);
        setRecent(res.data.recentActivity || []);
      }
    }).catch(console.error);
  }, []);
  const statCards = [
    { icon: "\u{1F464}", label: "Patients", value: stats.totalPatients, color: "#1e88e5", trend: "Total users" },
    { icon: "\u{1F468}\u200D\u2695\uFE0F", label: "Doctors", value: stats.totalDoctors, color: "#00bfa5", trend: `${stats.activeDoctors} active` },
    { icon: "\u{1F4C5}", label: "Appointments", value: stats.totalAppointments, color: "#f44336", trend: `${stats.pendingAppointments} pending` },
    { icon: "\u{1F4B0}", label: "Total Revenue", value: `${(stats.totalRevenue / 1e3).toFixed(1)}K XAF`, color: "#7c3aed", trend: "Admin cut" }
  ];
  return /* @__PURE__ */ React.createElement("div", { className: "page-anim" }, /* @__PURE__ */ React.createElement("div", { className: "page-header" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "page-title" }, "Dashboard"), /* @__PURE__ */ React.createElement("p", { className: "page-sub" }, "Welcome back, Administrator \u2022 ", (/* @__PURE__ */ new Date()).toDateString())), /* @__PURE__ */ React.createElement("button", { className: "btn-primary", onClick: () => onNav("appointments") }, "+ Appointment")), /* @__PURE__ */ React.createElement("div", { className: "stats-row" }, statCards.map((s) => /* @__PURE__ */ React.createElement("div", { key: s.label, className: "stat-card", style: { "--accent": s.color } }, /* @__PURE__ */ React.createElement("div", { className: "stat-icon-wrap", style: { background: s.color + "1a" } }, s.icon), /* @__PURE__ */ React.createElement("div", { className: "stat-body" }, /* @__PURE__ */ React.createElement("div", { className: "stat-label" }, s.label), /* @__PURE__ */ React.createElement("div", { className: "stat-value" }, s.value), /* @__PURE__ */ React.createElement("div", { className: "stat-trend" }, s.trend))))), /* @__PURE__ */ React.createElement("div", { className: "two-col" }, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("div", { className: "card-title" }, "Recent Appointments"), /* @__PURE__ */ React.createElement("button", { className: "ghost-btn", onClick: () => onNav("appointments") }, "View all \u2794")), /* @__PURE__ */ React.createElement("div", { className: "tbl-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "s-table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Patient"), /* @__PURE__ */ React.createElement("th", null, "Doctor"), /* @__PURE__ */ React.createElement("th", null, "Type"), /* @__PURE__ */ React.createElement("th", null, "Status"))), /* @__PURE__ */ React.createElement("tbody", null, recent.map((a) => /* @__PURE__ */ React.createElement("tr", { key: a._id }, /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement(Av, { name: a.patientId?.name || "?", size: 26 }), a.patientId?.name)), /* @__PURE__ */ React.createElement("td", { className: "hide-sm" }, "Dr. ", a.doctorId?.userId?.name || "?"), /* @__PURE__ */ React.createElement("td", null, a.healthType), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement(Badge, { label: a.status })))), recent.length === 0 && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 4 }, "No recent appointments")))))), /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-title", style: { marginBottom: 14 } }, "Quick Actions"), /* @__PURE__ */ React.createElement("div", { className: "quick-grid" }, [
    { icon: "\u2695\uFE0F", label: "Add Doctor", nav: "doctors", c: "#00bfa5" },
    { icon: "\u{1F465}", label: "Patients", nav: "patients", c: "#1e88e5" },
    { icon: "\u{1F4B3}", label: "Payments", nav: "payments", c: "#f44336" },
    { icon: "\u2699\uFE0F", label: "Settings", nav: "settings", c: "#fbbf24" }
  ].map((q) => /* @__PURE__ */ React.createElement("button", { key: q.label, className: "quick-btn", style: { "--qc": q.c }, onClick: () => onNav(q.nav) }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 22 } }, q.icon), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 700 } }, q.label))))))));
}
function AdminDoctors({ toast }) {
  const [doctors, setDoctors] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", specialty: "", experience: "", location: "", password: "", consultFee: 15e3 });
  const fetchDoctors = () => {
    API.get("/admin/doctors").then((res) => {
      if (res.data.success) setDoctors(res.data.doctors);
    }).catch(console.error);
  };
  useEffect(() => {
    fetchDoctors();
  }, []);
  const save = async () => {
    if (!form.name || !form.email || !form.password) return toast("Name, email and password required", "error");
    try {
      const res = await API.post("/admin/doctors", form);
      if (res.data.success) {
        toast("Doctor created successfully");
        setModal(false);
        fetchDoctors();
      } else toast(res.data.message, "error");
    } catch (err) {
      toast("Error creating doctor", "error");
    }
  };
  const toggleStatus = async (d) => {
    const newStatus = d.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await API.patch(`/admin/doctors/${d._id}/status`, { status: newStatus });
      toast(`Doctor ${newStatus.toLowerCase()}`);
      fetchDoctors();
    } catch (err) {
      toast("Error updating status", "error");
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "page-anim" }, /* @__PURE__ */ React.createElement("div", { className: "page-header" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "page-title" }, "Doctors"), /* @__PURE__ */ React.createElement("p", { className: "page-sub" }, "Manage clinic specialists")), /* @__PURE__ */ React.createElement("button", { className: "btn-primary", onClick: () => {
    setForm({ name: "", email: "", phone: "", specialty: "", experience: "", location: "", password: "", consultFee: 15e3 });
    setModal(true);
  } }, "+ Add Doctor")), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "tbl-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "s-table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Doctor"), /* @__PURE__ */ React.createElement("th", null, "Specialty"), /* @__PURE__ */ React.createElement("th", null, "Location"), /* @__PURE__ */ React.createElement("th", null, "Fee (XAF)"), /* @__PURE__ */ React.createElement("th", null, "Status"), /* @__PURE__ */ React.createElement("th", null, "Actions"))), /* @__PURE__ */ React.createElement("tbody", null, doctors.map((d) => /* @__PURE__ */ React.createElement("tr", { key: d._id }, /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement(Av, { name: d.userId?.name, size: 32 }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600 } }, d.userId?.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--muted)" } }, d.userId?.email)))), /* @__PURE__ */ React.createElement("td", null, d.specialty), /* @__PURE__ */ React.createElement("td", null, d.location), /* @__PURE__ */ React.createElement("td", null, d.consultFee), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement(Badge, { label: d.status })), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "ghost-btn", style: { color: d.status === "ACTIVE" ? "var(--red)" : "var(--green)" }, onClick: () => toggleStatus(d) }, d.status === "ACTIVE" ? "Suspend" : "Activate"))))))))), modal && /* @__PURE__ */ React.createElement(Modal, { title: "Add New Doctor", onClose: () => setModal(false), width: 460 }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } }, /* @__PURE__ */ React.createElement(FRow, { label: "Full Name*" }, /* @__PURE__ */ React.createElement("input", { style: inp, value: form.name, onChange: (e) => setForm((f) => ({ ...f, name: e.target.value })), placeholder: "Dr. John Doe" })), /* @__PURE__ */ React.createElement(FRow, { label: "Email*" }, /* @__PURE__ */ React.createElement("input", { style: inp, type: "email", value: form.email, onChange: (e) => setForm((f) => ({ ...f, email: e.target.value })) })), /* @__PURE__ */ React.createElement(FRow, { label: "Phone" }, /* @__PURE__ */ React.createElement("input", { style: inp, value: form.phone, onChange: (e) => setForm((f) => ({ ...f, phone: e.target.value })) })), /* @__PURE__ */ React.createElement(FRow, { label: "Temporary Password*" }, /* @__PURE__ */ React.createElement("input", { style: inp, value: form.password, onChange: (e) => setForm((f) => ({ ...f, password: e.target.value })) })), /* @__PURE__ */ React.createElement(FRow, { label: "Specialty" }, /* @__PURE__ */ React.createElement("input", { style: inp, value: form.specialty, onChange: (e) => setForm((f) => ({ ...f, specialty: e.target.value })) })), /* @__PURE__ */ React.createElement(FRow, { label: "Experience (yrs)" }, /* @__PURE__ */ React.createElement("input", { style: inp, value: form.experience, onChange: (e) => setForm((f) => ({ ...f, experience: e.target.value })) })), /* @__PURE__ */ React.createElement(FRow, { label: "Consultation Fee (XAF)" }, /* @__PURE__ */ React.createElement("input", { style: inp, type: "number", value: form.consultFee, onChange: (e) => setForm((f) => ({ ...f, consultFee: e.target.value })) })), /* @__PURE__ */ React.createElement(FRow, { label: "Location" }, /* @__PURE__ */ React.createElement("input", { style: inp, value: form.location, onChange: (e) => setForm((f) => ({ ...f, location: e.target.value })) }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 } }, /* @__PURE__ */ React.createElement("button", { className: "ghost-btn", onClick: () => setModal(false) }, "Cancel"), /* @__PURE__ */ React.createElement("button", { className: "btn-primary", onClick: save }, "Create Doctor"))));
}
function AdminPatients({ toast }) {
  const [patients, setPatients] = useState([]);
  useEffect(() => {
    API.get("/admin/users").then((res) => {
      if (res.data.success) setPatients(res.data.users.filter((u) => u.role === "PATIENT"));
    }).catch(console.error);
  }, []);
  return /* @__PURE__ */ React.createElement("div", { className: "page-anim" }, /* @__PURE__ */ React.createElement("div", { className: "page-header" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "page-title" }, "Patients"), /* @__PURE__ */ React.createElement("p", { className: "page-sub" }, "Registered patients database"))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "tbl-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "s-table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Patient"), /* @__PURE__ */ React.createElement("th", null, "Phone"), /* @__PURE__ */ React.createElement("th", null, "Joined"), /* @__PURE__ */ React.createElement("th", null, "Status"))), /* @__PURE__ */ React.createElement("tbody", null, patients.map((p) => /* @__PURE__ */ React.createElement("tr", { key: p._id }, /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement(Av, { name: p.name, size: 32 }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600 } }, p.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--muted)" } }, p.email)))), /* @__PURE__ */ React.createElement("td", null, p.phone || "-"), /* @__PURE__ */ React.createElement("td", null, new Date(p.createdAt).toLocaleDateString()), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement(Badge, { label: p.status })))))))));
}
function AdminAppointments({ toast }) {
  const [appts, setAppts] = useState([]);
  const fetchAppts = () => {
    API.get("/admin/appointments").then((res) => {
      if (res.data.success) setAppts(res.data.appointments);
    }).catch(console.error);
  };
  useEffect(() => {
    fetchAppts();
  }, []);
  const updateStatus = async (id, status) => {
    try {
      await API.patch(`/admin/appointments/${id}/status`, { status });
      toast(`Appointment ${status.toLowerCase()}`);
      fetchAppts();
    } catch (err) {
      toast("Error updating status", "error");
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "page-anim" }, /* @__PURE__ */ React.createElement("div", { className: "page-header" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "page-title" }, "Appointments"), /* @__PURE__ */ React.createElement("p", { className: "page-sub" }, "All platform bookings"))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "tbl-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "s-table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Patient"), /* @__PURE__ */ React.createElement("th", null, "Doctor"), /* @__PURE__ */ React.createElement("th", null, "Type"), /* @__PURE__ */ React.createElement("th", null, "Date & Time"), /* @__PURE__ */ React.createElement("th", null, "Status"), /* @__PURE__ */ React.createElement("th", null, "Actions"))), /* @__PURE__ */ React.createElement("tbody", null, appts.map((a) => /* @__PURE__ */ React.createElement("tr", { key: a._id }, /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement(Av, { name: a.patientId?.name || "?", size: 28 }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600 } }, a.patientId?.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--muted)" } }, a.patientId?.phone)))), /* @__PURE__ */ React.createElement("td", null, "Dr. ", a.doctorId?.userId?.name || "?"), /* @__PURE__ */ React.createElement("td", null, a.healthType), /* @__PURE__ */ React.createElement("td", null, new Date(a.date).toLocaleDateString(), " at ", a.time), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement(Badge, { label: a.status })), /* @__PURE__ */ React.createElement("td", null, a.status === "PENDING" && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "ghost-btn", style: { color: "var(--green)" }, onClick: () => updateStatus(a._id, "CONFIRMED") }, "Confirm"), /* @__PURE__ */ React.createElement("button", { className: "ghost-btn", style: { color: "var(--red)" }, onClick: () => updateStatus(a._id, "CANCELLED") }, "Cancel"))))))))));
}
function AdminPayments({ toast }) {
  const [payments, setPayments] = useState([]);
  useEffect(() => {
    API.get("/admin/payments").then((res) => {
      if (res.data.success) setPayments(res.data.payments);
    }).catch(console.error);
  }, []);
  return /* @__PURE__ */ React.createElement("div", { className: "page-anim" }, /* @__PURE__ */ React.createElement("div", { className: "page-header" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "page-title" }, "Payments"), /* @__PURE__ */ React.createElement("p", { className: "page-sub" }, "Transaction history & admin fees"))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "tbl-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "s-table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Patient"), /* @__PURE__ */ React.createElement("th", null, "Doctor"), /* @__PURE__ */ React.createElement("th", null, "Service"), /* @__PURE__ */ React.createElement("th", null, "Amount (XAF)"), /* @__PURE__ */ React.createElement("th", null, "Admin Cut"), /* @__PURE__ */ React.createElement("th", null, "Status"))), /* @__PURE__ */ React.createElement("tbody", null, payments.map((p) => /* @__PURE__ */ React.createElement("tr", { key: p._id }, /* @__PURE__ */ React.createElement("td", { style: { fontWeight: 600 } }, p.patientId?.name || "?"), /* @__PURE__ */ React.createElement("td", null, "Dr. ", p.doctorId?.userId?.name || "?"), /* @__PURE__ */ React.createElement("td", null, p.service), /* @__PURE__ */ React.createElement("td", { style: { fontWeight: 700 } }, p.amount), /* @__PURE__ */ React.createElement("td", { style: { color: "var(--green)", fontWeight: 700 } }, p.adminFee || 0), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement(Badge, { label: p.status })))))))));
}
function AdminSettings({ toast }) {
  const save = () => toast("Settings saved!");
  return /* @__PURE__ */ React.createElement("div", { className: "page-anim" }, /* @__PURE__ */ React.createElement("div", { className: "page-header" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "page-title" }, "Settings"), /* @__PURE__ */ React.createElement("p", { className: "page-sub" }, "System configuration"))), /* @__PURE__ */ React.createElement("div", { className: "card", style: { maxWidth: 560 } }, /* @__PURE__ */ React.createElement("div", { className: "card-title", style: { marginBottom: 18 } }, "Clinic Settings"), /* @__PURE__ */ React.createElement(FRow, { label: "Clinic Name" }, /* @__PURE__ */ React.createElement("input", { style: inp, defaultValue: "TOOTHEASE" })), /* @__PURE__ */ React.createElement(FRow, { label: "Admin Commission % (default)" }, /* @__PURE__ */ React.createElement("input", { style: inp, type: "number", defaultValue: 12 })), /* @__PURE__ */ React.createElement("button", { className: "btn-primary", style: { marginTop: 8 }, onClick: save }, "Save Settings")));
}
export default function AdminPanel({ onLogout }) {
  const navigate = useNavigate();
  const [view, setView] = useState("overview");
  const { list: toasts, fire: toast } = useToast();
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    API.get("/auth/me").then((res) => {
      if (res.data.success && res.data.user.role !== "ADMIN") {
        navigate("/");
      }
    }).catch(() => {
      navigate("/login");
    });
  }, [navigate]);
  const NAV = [
    { id: "overview", icon: "\u{1F4CA}", label: "Overview" },
    { sep: true, label: "MANAGEMENT" },
    { id: "doctors", icon: "\u2695\uFE0F", label: "Doctors" },
    { id: "patients", icon: "\u{1F465}", label: "Patients" },
    { id: "appointments", icon: "\u{1F4C5}", label: "Appointments" },
    { sep: true, label: "FINANCE & COMMS" },
    { id: "payments", icon: "\u{1F4B3}", label: "Payments" },
    { id: "memberships", icon: "\u{1F4C8}", label: "SaaS MRR" },
    { sep: true, label: "SYSTEM" },
    { id: "settings", icon: "\u2699\uFE0F", label: "Settings" }
  ];
  return /* @__PURE__ */ React.createElement("div", { className: "adm-root" }, /* @__PURE__ */ React.createElement("aside", { className: "adm-side hide-print" }, /* @__PURE__ */ React.createElement("div", { className: "adm-logo", style: { display: "flex", justifyContent: "center", padding: "20px 0" } }, /* @__PURE__ */ React.createElement("img", { src: "/logo.png", alt: "TOOTHEASE Admin", style: { height: "50px", objectFit: "contain", filter: "brightness(0) invert(1)" } })), /* @__PURE__ */ React.createElement("nav", { className: "adm-nav" }, NAV.map((n, i) => n.sep ? /* @__PURE__ */ React.createElement("div", { key: "s" + i, className: "adm-nav-sep" }, n.label) : /* @__PURE__ */ React.createElement("div", { key: n.id, className: `adm-nav-item ${view === n.id ? "active" : ""}`, onClick: () => setView(n.id) }, /* @__PURE__ */ React.createElement("span", { className: "adm-nav-icon" }, n.icon), n.label))), /* @__PURE__ */ React.createElement("div", { className: "adm-side-foot" }, /* @__PURE__ */ React.createElement("div", { className: "adm-profile" }, /* @__PURE__ */ React.createElement(Av, { name: "Admin", size: 32 }), /* @__PURE__ */ React.createElement("div", { className: "adm-profile-info" }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13 } }, "Admin"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--muted)" } }, "System Root"))), /* @__PURE__ */ React.createElement("button", { className: "adm-logout", onClick: () => {
    localStorage.clear();
    navigate("/login");
    if (onLogout) onLogout();
  } }, "\u{1F6AA} Logout"))), /* @__PURE__ */ React.createElement("main", { className: "adm-main" }, view === "overview" && /* @__PURE__ */ React.createElement(AdminOverview, { onNav: setView, toast }), view === "doctors" && /* @__PURE__ */ React.createElement(AdminDoctors, { toast }), view === "patients" && /* @__PURE__ */ React.createElement(AdminPatients, { toast }), view === "appointments" && /* @__PURE__ */ React.createElement(AdminAppointments, { toast }), view === "payments" && /* @__PURE__ */ React.createElement(AdminPayments, { toast }), view === "memberships" && /* @__PURE__ */ React.createElement(AdminMemberships, { toast }), view === "settings" && /* @__PURE__ */ React.createElement(AdminSettings, { toast })), /* @__PURE__ */ React.createElement("div", { className: "toast-wrap hide-print" }, toasts.map((t) => /* @__PURE__ */ React.createElement("div", { key: t.id, className: `toast ${t.type}` }, t.msg))));
}
