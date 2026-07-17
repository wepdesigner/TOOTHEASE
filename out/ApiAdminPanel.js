import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import AdminMemberships from "./AdminMemberships";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
const COLORS = ["#1e88e5", "#00bfa5", "#7c3aed", "#f44336", "#ff7043", "#0891b2", "#16a34a", "#be185d"];
function Avatar({ name = "?", size = 36, src }) {
  if (src) return /* @__PURE__ */ React.createElement("img", { src, alt: name, style: { width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid #e2e8f0" } });
  const init = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const color = COLORS[(name.charCodeAt(0) || 0) % COLORS.length];
  return /* @__PURE__ */ React.createElement("div", { style: { width: size, height: size, borderRadius: "50%", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.37, flexShrink: 0, fontFamily: "'Sora',sans-serif" } }, init);
}
const SC = {
  confirmed: "#22c55e",
  active: "#22c55e",
  paid: "#22c55e",
  completed: "#22c55e",
  accepted: "#22c55e",
  online: "#22c55e",
  pending: "#fbbf24",
  scheduled: "#fbbf24",
  cancelled: "#ef4444",
  declined: "#ef4444",
  inactive: "#94a3b8",
  suspended: "#ef4444"
};
function Badge({ label, color }) {
  const c = color || SC[label?.toLowerCase()] || "#94a3b8";
  return /* @__PURE__ */ React.createElement("span", { style: { background: c + "15", color: c, border: `1px solid ${c}30`, borderRadius: 999, padding: "4px 12px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", whiteSpace: "nowrap" } }, label);
}
const NAV = [
  { section: "Administration" },
  { key: "overview", icon: "layout-dashboard", label: "Dashboard" },
  { key: "doctors", icon: "stethoscope", label: "Doctors" },
  { key: "patients", icon: "users", label: "Patients" },
  { key: "appointments", icon: "calendar-event", label: "Appointments" },
  { key: "payments", icon: "cash", label: "Payments" },
  { key: "memberships", icon: "chart-bar", label: "SaaS MRR" }
];
export default function ApiAdminPanel({ admin: sessionUser, onLogout }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [sideOpen, setSideOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const handleLogout = () => {
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
  if (loading || !data) return /* @__PURE__ */ React.createElement("div", { style: { padding: "3rem", textAlign: "center" } }, "Loading Admin Portal...");
  const { stats, recentActivity } = data;
  return /* @__PURE__ */ React.createElement("div", { className: "dp-root" }, /* @__PURE__ */ React.createElement("style", null, CSS), /* @__PURE__ */ React.createElement("aside", { className: `dp-sidebar${sideOpen ? " open" : ""}` }, /* @__PURE__ */ React.createElement("div", { className: "dp-brand" }, /* @__PURE__ */ React.createElement("img", { src: "/logo.png", alt: "Zendenta Logo", style: { filter: "brightness(0) invert(0)" }, onError: (e) => {
    e.target.style.display = "none";
  } }), /* @__PURE__ */ React.createElement("div", { className: "dp-brand-text" }, "STECH")), /* @__PURE__ */ React.createElement("nav", { className: "dp-nav" }, NAV.map((n, i) => {
    if (n.section) return null;
    return /* @__PURE__ */ React.createElement("button", { key: n.key, className: `dp-nav-item${tab === n.key ? " active" : ""}`, onClick: () => {
      setTab(n.key);
      setSideOpen(false);
    } }, /* @__PURE__ */ React.createElement("span", { className: "dp-nav-icon" }, /* @__PURE__ */ React.createElement("i", { className: `ti ti-${n.icon}` })), /* @__PURE__ */ React.createElement("span", null, n.label));
  })), /* @__PURE__ */ React.createElement("div", { className: "dp-user-block" }, /* @__PURE__ */ React.createElement(Avatar, { name: sessionUser?.name || "Admin", size: 44 }), /* @__PURE__ */ React.createElement("div", { style: { overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { color: "var(--text-dark)", fontWeight: 800, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, sessionUser?.name || "Dr. Adam"), /* @__PURE__ */ React.createElement("div", { style: { color: "var(--text-gray)", fontSize: 12, fontWeight: 600 } }, "Administrator")))), /* @__PURE__ */ React.createElement("div", { className: "dp-main" }, /* @__PURE__ */ React.createElement("header", { className: "dp-topbar" }, /* @__PURE__ */ React.createElement("button", { className: "dp-hamburger", onClick: () => setSideOpen((s) => !s), style: { display: "none" } }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-menu-2" })), /* @__PURE__ */ React.createElement("div", { className: "dp-topbar-title" }, "Welcome Back, ", sessionUser?.name?.split(" ")[0] || "Dr. John", "!"), /* @__PURE__ */ React.createElement("div", { className: "dp-top-right" }, /* @__PURE__ */ React.createElement("div", { className: "dp-search" }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-search", style: { color: "#94a3b8", fontSize: 18 } }), /* @__PURE__ */ React.createElement("input", { type: "text", placeholder: "Search..." })), /* @__PURE__ */ React.createElement("button", { className: "dp-period-btn" }, "Period: Monthly ", /* @__PURE__ */ React.createElement("i", { className: "ti ti-chevron-down" })), /* @__PURE__ */ React.createElement(Avatar, { name: sessionUser?.name || "Admin", size: 40 }))), /* @__PURE__ */ React.createElement("main", { className: "dp-content" }, tab === "overview" && /* @__PURE__ */ React.createElement(AdminOverview, { stats, recent: recentActivity, admin: sessionUser }), tab === "doctors" && /* @__PURE__ */ React.createElement(AdminDoctors, null), tab === "patients" && /* @__PURE__ */ React.createElement(AdminPatients, null), tab === "appointments" && /* @__PURE__ */ React.createElement(AdminAppointments, null), tab === "payments" && /* @__PURE__ */ React.createElement(AdminPayments, null), tab === "memberships" && /* @__PURE__ */ React.createElement(AdminMemberships, null))), sideOpen && /* @__PURE__ */ React.createElement("div", { className: "dp-overlay", onClick: () => setSideOpen(false), style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 250 } }));
}
function AdminOverview({ stats, recent, admin }) {
  const COLORS2 = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
  const mAppts = stats?.monthlyAppointments || [];
  const pTreat = stats?.treatmentStats || [];
  const sRates = stats?.successRates || [];
  const tAppts = stats?.todaysAppointments || [];
  return /* @__PURE__ */ React.createElement("div", { className: "dp-anim" }, /* @__PURE__ */ React.createElement("div", { className: "oa-grid" }, /* @__PURE__ */ React.createElement("div", { style: { gridColumn: "span 5", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 } }, /* @__PURE__ */ React.createElement("div", { className: "oa-stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "oa-stat-top" }, /* @__PURE__ */ React.createElement("div", { className: "oa-stat-icon", style: { background: "#eff6ff" } }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-users" })), /* @__PURE__ */ React.createElement("div", { className: "oa-trend up" }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-trending-up" }), " +12%")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "oa-stat-num" }, stats?.totalPatients || 0), /* @__PURE__ */ React.createElement("div", { className: "oa-stat-label" }, "Total Patients"))), /* @__PURE__ */ React.createElement("div", { className: "oa-stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "oa-stat-top" }, /* @__PURE__ */ React.createElement("div", { className: "oa-stat-icon", style: { background: "#ecfdf5", color: "#10b981" } }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-stethoscope" })), /* @__PURE__ */ React.createElement("div", { className: "oa-trend up" }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-trending-up" }), " +2")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "oa-stat-num" }, stats?.activeDoctors || 0), /* @__PURE__ */ React.createElement("div", { className: "oa-stat-label" }, "Active Doctors"))), /* @__PURE__ */ React.createElement("div", { className: "oa-stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "oa-stat-top" }, /* @__PURE__ */ React.createElement("div", { className: "oa-stat-icon", style: { background: "#fef2f2", color: "#ef4444" } }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-calendar-clock" })), /* @__PURE__ */ React.createElement("div", { className: "oa-trend down" }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-trending-down" }), " -5%")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "oa-stat-num" }, stats?.pendingAppointments || 0), /* @__PURE__ */ React.createElement("div", { className: "oa-stat-label" }, "Pending Appointments"))), /* @__PURE__ */ React.createElement("div", { className: "oa-stat-card" }, /* @__PURE__ */ React.createElement("div", { className: "oa-stat-top" }, /* @__PURE__ */ React.createElement("div", { className: "oa-stat-icon", style: { background: "#fffbeb", color: "#f59e0b" } }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-currency-dollar" })), /* @__PURE__ */ React.createElement("div", { className: "oa-trend up" }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-trending-up" }), " +8%")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "oa-stat-num" }, (stats?.totalRevenue || 0).toLocaleString()), /* @__PURE__ */ React.createElement("div", { className: "oa-stat-label" }, "Revenue (XAF)")))), /* @__PURE__ */ React.createElement("div", { className: "oa-card", style: { gridColumn: "span 7", display: "flex", flexDirection: "column" } }, /* @__PURE__ */ React.createElement("div", { className: "oa-card-title" }, /* @__PURE__ */ React.createElement("span", null, "Appointment Activity"), /* @__PURE__ */ React.createElement("button", { className: "dp-btn-outline" }, "Export")), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minHeight: 200 } }, /* @__PURE__ */ React.createElement(ResponsiveContainer, { width: "100%", height: "100%" }, /* @__PURE__ */ React.createElement(BarChart, { data: mAppts, margin: { top: 10, right: 10, left: -20, bottom: 0 } }, /* @__PURE__ */ React.createElement(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: "#e2e8f0" }), /* @__PURE__ */ React.createElement(XAxis, { dataKey: "name", axisLine: false, tickLine: false, tick: { fontSize: 12, fill: "#64748b" }, dy: 10 }), /* @__PURE__ */ React.createElement(YAxis, { axisLine: false, tickLine: false, tick: { fontSize: 12, fill: "#64748b" } }), /* @__PURE__ */ React.createElement(Tooltip, { cursor: { fill: "#f8fafc" }, contentStyle: { borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" } }), /* @__PURE__ */ React.createElement(Legend, { iconType: "circle", wrapperStyle: { fontSize: 12, paddingTop: 20 } }), /* @__PURE__ */ React.createElement(Bar, { dataKey: "Booked", fill: "#3b82f6", radius: [4, 4, 0, 0], barSize: 12 }), /* @__PURE__ */ React.createElement(Bar, { dataKey: "Canceled", fill: "#10b981", radius: [4, 4, 0, 0], barSize: 12 })))))), /* @__PURE__ */ React.createElement("div", { className: "oa-grid" }, /* @__PURE__ */ React.createElement("div", { className: "oa-card", style: { gridColumn: "span 4" } }, /* @__PURE__ */ React.createElement("div", { className: "oa-card-title" }, "Top Treatments"), /* @__PURE__ */ React.createElement("div", { style: { height: 200 } }, /* @__PURE__ */ React.createElement(ResponsiveContainer, { width: "100%", height: "100%" }, /* @__PURE__ */ React.createElement(PieChart, null, /* @__PURE__ */ React.createElement(Pie, { data: pTreat, innerRadius: 50, outerRadius: 80, paddingAngle: 5, dataKey: "value", stroke: "none" }, pTreat.map((entry, index) => /* @__PURE__ */ React.createElement(Cell, { key: `cell-${index}`, fill: COLORS2[index % COLORS2.length] }))), /* @__PURE__ */ React.createElement(Tooltip, { contentStyle: { borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" } }), /* @__PURE__ */ React.createElement(Legend, { layout: "vertical", verticalAlign: "middle", align: "right", iconType: "circle", wrapperStyle: { fontSize: 12 } }))))), /* @__PURE__ */ React.createElement("div", { className: "oa-card", style: { gridColumn: "span 4" } }, /* @__PURE__ */ React.createElement("div", { className: "oa-card-title" }, "New Patient Details"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 16, alignItems: "center", marginBottom: 20 } }, /* @__PURE__ */ React.createElement(Avatar, { name: "Sophia Lauren", size: 50 }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 800, color: "var(--text-dark)" } }, "Sophia Lauren"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--text-gray)", fontWeight: 500 } }, "Registered Today"))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 13 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text-gray)" } }, "Gender:"), " ", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("b", null, "Female")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text-gray)" } }, "Age:"), " ", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("b", null, "24 yrs")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text-gray)" } }, "Height:"), " ", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("b", null, "165 cm")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text-gray)" } }, "Weight:"), " ", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("b", null, "55 kg")))), /* @__PURE__ */ React.createElement("div", { className: "oa-card", style: { gridColumn: "span 4", overflowY: "auto" } }, /* @__PURE__ */ React.createElement("div", { className: "oa-card-title" }, "Approval Requests"), /* @__PURE__ */ React.createElement("div", null, !recent || recent.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { padding: 20, textAlign: "center", color: "#94a3b8" } }, "No requests") : recent.slice(0, 3).map((r) => /* @__PURE__ */ React.createElement("div", { key: r._id, className: "oa-list-item" }, /* @__PURE__ */ React.createElement("div", { className: "oa-list-user" }, /* @__PURE__ */ React.createElement(Avatar, { name: r.patientId?.name, size: 36 }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "oa-list-name" }, r.patientId?.name), /* @__PURE__ */ React.createElement("div", { className: "oa-list-sub" }, r.healthType))), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-dark)", marginBottom: 4 } }, r.date?.split("T")[0]), /* @__PURE__ */ React.createElement(Badge, { label: "PENDING", color: "#f59e0b" }))))))), /* @__PURE__ */ React.createElement("div", { className: "oa-grid" }, /* @__PURE__ */ React.createElement("div", { className: "oa-card", style: { gridColumn: "span 4", maxHeight: 300, overflowY: "auto" } }, /* @__PURE__ */ React.createElement("div", { className: "oa-card-title" }, "Today's Appointment ", /* @__PURE__ */ React.createElement("span", { style: { background: "#eff6ff", color: "#3b82f6", padding: "2px 8px", borderRadius: 99, fontSize: 12 } }, tAppts.length)), /* @__PURE__ */ React.createElement("div", null, tAppts.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { padding: 20, textAlign: "center", color: "#94a3b8" } }, "No appointments today") : tAppts.map((a) => /* @__PURE__ */ React.createElement("div", { key: a._id, className: "oa-list-item" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "oa-list-name" }, a.healthType), /* @__PURE__ */ React.createElement("div", { className: "oa-list-sub" }, a.patientId?.name)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-dark)", background: "#f1f5f9", padding: "4px 10px", borderRadius: 6 } }, a.time))))), /* @__PURE__ */ React.createElement("div", { className: "oa-card", style: { gridColumn: "span 4", display: "flex", flexDirection: "column" } }, /* @__PURE__ */ React.createElement("div", { className: "oa-card-title" }, "Success Rate"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 32, fontWeight: 800 } }, "90%"), /* @__PURE__ */ React.createElement("div", { className: "oa-trend up" }, /* @__PURE__ */ React.createElement("i", { className: "ti ti-trending-up" }), " +2%")), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minHeight: 120 } }, /* @__PURE__ */ React.createElement(ResponsiveContainer, { width: "100%", height: "100%" }, /* @__PURE__ */ React.createElement(LineChart, { data: sRates }, /* @__PURE__ */ React.createElement(Tooltip, { contentStyle: { borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" } }), /* @__PURE__ */ React.createElement(Line, { type: "monotone", dataKey: "rate", stroke: "#10b981", strokeWidth: 3, dot: { r: 4, fill: "#10b981", strokeWidth: 0 }, activeDot: { r: 6 } }))))), /* @__PURE__ */ React.createElement("div", { className: "oa-card", style: { gridColumn: "span 4", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", justifyContent: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "var(--text-gray)" } }, "Total Patients This Month"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 36, fontWeight: 800, color: "var(--text-dark)", margin: "8px 0" } }, Math.floor((stats?.totalPatients || 0) / 4) + 12), /* @__PURE__ */ React.createElement("button", { className: "dp-btn-outline", style: { width: "max-content" } }, "View More")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", justifyContent: "center", borderLeft: "1px solid var(--border)", paddingLeft: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "var(--text-gray)" } }, "Revenue (Month)"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 28, fontWeight: 800, color: "var(--text-dark)", margin: "8px 0" } }, Math.floor((stats?.totalRevenue || 0) / 3).toLocaleString()), /* @__PURE__ */ React.createElement("button", { className: "dp-btn-outline", style: { width: "max-content" } }, "View More")))));
}
function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const fetchDocs = async () => {
    try {
      const res = await API.get("/admin/doctors");
      if (res.data.success) setDoctors(res.data.doctors);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchDocs();
  }, []);
  const changeStatus = async (id, status) => {
    try {
      await API.patch(`/admin/doctors/${id}/status`, { status });
      fetchDocs();
    } catch (err) {
      console.error(err);
    }
  };
  const createDoctor = async (event) => {
    event.preventDefault();
    try {
      await API.post("/admin/doctors", form);
      setForm(null);
      fetchDocs();
    } catch (err) {
      alert(err.response?.data?.message || "Unable to create doctor");
    }
  };
  if (loading) return /* @__PURE__ */ React.createElement("div", null, "Loading doctors...");
  return /* @__PURE__ */ React.createElement("div", { className: "dp-anim" }, /* @__PURE__ */ React.createElement("div", { className: "dp-page-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "dp-title" }, "Manage Doctors")), /* @__PURE__ */ React.createElement("button", { className: "dp-btn-primary", onClick: () => setForm({ name: "", email: "", password: "", specialty: "", phone: "", consultFee: 15e3 }) }, "Add Doctor")), form && /* @__PURE__ */ React.createElement("form", { className: "dp-card", onSubmit: createDoctor, style: { marginBottom: 16, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 } }, [["name", "Name"], ["email", "Email"], ["password", "Password"], ["specialty", "Specialty"], ["phone", "Phone"], ["consultFee", "Consult fee"]].map(([key, label]) => /* @__PURE__ */ React.createElement("input", { key, required: ["name", "email", "password", "specialty"].includes(key), type: key === "password" ? "password" : key === "consultFee" ? "number" : "text", placeholder: label, value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) })), /* @__PURE__ */ React.createElement("button", { className: "dp-btn-primary", type: "submit" }, "Create"), /* @__PURE__ */ React.createElement("button", { className: "dp-ghost", type: "button", onClick: () => setForm(null) }, "Cancel")), /* @__PURE__ */ React.createElement("div", { className: "dp-card" }, /* @__PURE__ */ React.createElement("div", { className: "dp-tbl-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dp-table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Doctor"), /* @__PURE__ */ React.createElement("th", null, "Specialty"), /* @__PURE__ */ React.createElement("th", null, "Phone"), /* @__PURE__ */ React.createElement("th", null, "Status"), /* @__PURE__ */ React.createElement("th", null, "Actions"))), /* @__PURE__ */ React.createElement("tbody", null, doctors.map((d) => /* @__PURE__ */ React.createElement("tr", { key: d._id }, /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement(Avatar, { name: d.userId?.name, size: 30 }), /* @__PURE__ */ React.createElement("strong", null, d.userId?.name))), /* @__PURE__ */ React.createElement("td", null, d.specialty), /* @__PURE__ */ React.createElement("td", null, d.userId?.phone || "-"), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement(Badge, { label: d.status })), /* @__PURE__ */ React.createElement("td", null, d.status !== "ACTIVE" && /* @__PURE__ */ React.createElement("button", { onClick: () => changeStatus(d._id, "ACTIVE"), style: { background: "#10b981", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 700, marginRight: 6 } }, "Approve"), d.status === "ACTIVE" && /* @__PURE__ */ React.createElement("button", { onClick: () => changeStatus(d._id, "SUSPENDED"), style: { background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 700 } }, "Suspend")))))))));
}
function AdminPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    API.get("/admin/users").then((res) => {
      if (res.data.success) setPatients(res.data.users.filter((u) => u.role === "PATIENT"));
      setLoading(false);
    });
  }, []);
  if (loading) return /* @__PURE__ */ React.createElement("div", null, "Loading patients...");
  const toggleStatus = async (patient) => {
    await API.patch(`/admin/users/${patient._id}/status`, { status: patient.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" });
    setPatients((ps) => ps.map((p) => p._id === patient._id ? { ...p, status: patient.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" } : p));
  };
  return /* @__PURE__ */ React.createElement("div", { className: "dp-anim" }, /* @__PURE__ */ React.createElement("div", { className: "dp-page-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "dp-title" }, "Registered Patients"))), /* @__PURE__ */ React.createElement("div", { className: "dp-card" }, /* @__PURE__ */ React.createElement("div", { className: "dp-tbl-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dp-table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Name"), /* @__PURE__ */ React.createElement("th", null, "Email"), /* @__PURE__ */ React.createElement("th", null, "Phone"), /* @__PURE__ */ React.createElement("th", null, "Joined"), /* @__PURE__ */ React.createElement("th", null, "Action"))), /* @__PURE__ */ React.createElement("tbody", null, patients.map((p) => /* @__PURE__ */ React.createElement("tr", { key: p._id }, /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement(Avatar, { name: p.name, size: 30 }), /* @__PURE__ */ React.createElement("strong", null, p.name))), /* @__PURE__ */ React.createElement("td", null, p.email), /* @__PURE__ */ React.createElement("td", null, p.phone || "-"), /* @__PURE__ */ React.createElement("td", null, p.createdAt?.split("T")[0]), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("button", { className: "dp-ghost", onClick: () => toggleStatus(p) }, p.status === "ACTIVE" ? "Deactivate" : "Activate")))))))));
}
function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  useEffect(() => {
    API.get("/admin/appointments").then((r) => setAppointments(r.data.appointments || [])).catch(console.error);
  }, []);
  const setStatus = async (id, status) => {
    await API.patch(`/admin/appointments/${id}/status`, { status });
    setAppointments((items) => items.map((a) => a._id === id ? { ...a, status } : a));
  };
  return /* @__PURE__ */ React.createElement("div", { className: "dp-anim" }, /* @__PURE__ */ React.createElement("div", { className: "dp-page-head" }, /* @__PURE__ */ React.createElement("h1", { className: "dp-title" }, "Appointments")), /* @__PURE__ */ React.createElement("div", { className: "dp-card" }, /* @__PURE__ */ React.createElement("div", { className: "dp-tbl-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dp-table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Patient"), /* @__PURE__ */ React.createElement("th", null, "Doctor"), /* @__PURE__ */ React.createElement("th", null, "Service"), /* @__PURE__ */ React.createElement("th", null, "Date"), /* @__PURE__ */ React.createElement("th", null, "Status"), /* @__PURE__ */ React.createElement("th", null, "Action"))), /* @__PURE__ */ React.createElement("tbody", null, appointments.map((a) => /* @__PURE__ */ React.createElement("tr", { key: a._id }, /* @__PURE__ */ React.createElement("td", null, a.patientId?.name), /* @__PURE__ */ React.createElement("td", null, "Dr. ", a.doctorId?.userId?.name), /* @__PURE__ */ React.createElement("td", null, a.healthType), /* @__PURE__ */ React.createElement("td", null, a.date?.split("T")[0], " ", a.time), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement(Badge, { label: a.status })), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("select", { value: a.status, onChange: (e) => setStatus(a._id, e.target.value) }, /* @__PURE__ */ React.createElement("option", null, "PENDING"), /* @__PURE__ */ React.createElement("option", null, "CONFIRMED"), /* @__PURE__ */ React.createElement("option", null, "COMPLETED"), /* @__PURE__ */ React.createElement("option", null, "CANCELLED"))))))))));
}
function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    API.get("/admin/payments").then((res) => {
      if (res.data.success) setPayments(res.data.payments);
      setLoading(false);
    });
  }, []);
  if (loading) return /* @__PURE__ */ React.createElement("div", null, "Loading payments...");
  const complete = async (id) => {
    await API.patch(`/admin/payments/${id}/complete`);
    setPayments((items) => items.map((p) => p._id === id ? { ...p, status: "COMPLETED" } : p));
  };
  return /* @__PURE__ */ React.createElement("div", { className: "dp-anim" }, /* @__PURE__ */ React.createElement("div", { className: "dp-page-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "dp-title" }, "Payment History"))), /* @__PURE__ */ React.createElement("div", { className: "dp-card" }, /* @__PURE__ */ React.createElement("div", { className: "dp-tbl-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "dp-table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Patient"), /* @__PURE__ */ React.createElement("th", null, "Doctor"), /* @__PURE__ */ React.createElement("th", null, "Service"), /* @__PURE__ */ React.createElement("th", null, "Amount"), /* @__PURE__ */ React.createElement("th", null, "Status"), /* @__PURE__ */ React.createElement("th", null, "Action"))), /* @__PURE__ */ React.createElement("tbody", null, payments.map((p) => /* @__PURE__ */ React.createElement("tr", { key: p._id }, /* @__PURE__ */ React.createElement("td", null, p.patientId?.name), /* @__PURE__ */ React.createElement("td", null, "Dr. ", p.doctorId?.userId?.name), /* @__PURE__ */ React.createElement("td", null, p.service), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("strong", { style: { color: "#00bfa5" } }, (p.amount || 0).toLocaleString("fr-CM"), " XAF")), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement(Badge, { label: p.status })), /* @__PURE__ */ React.createElement("td", null, p.status === "PENDING" && /* @__PURE__ */ React.createElement("button", { className: "dp-ghost", onClick: () => complete(p._id) }, "Mark paid")))))))));
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
