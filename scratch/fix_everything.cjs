const fs = require('fs');
const path = require('path');

const ppPath = path.join(__dirname, '../src/Pages/Patient/PatientPanel.jsx');
let ppCode = fs.readFileSync(ppPath, 'utf8');

const replacementString = `function ConfirmDialog({ msg, onConfirm, onCancel }) {
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
  { section: "Services" },
  { key: "appointments", icon: "ti-calendar-check", label: "My Appointments" },
  { key: "book", icon: "ti-calendar-plus", label: "Book Appointment" },
  { key: "consultations", icon: "ti-video", label: "Consultations" },
  { key: "home_visit", icon: "ti-home-heart", label: "Home Service" },
  { section: "Health" },
  { key: "my_chart", icon: "ti-dental", label: "My 3D Chart" },
  { key: "prescriptions", icon: "ti-pill", label: "Prescriptions" },
  { key: "records", icon: "ti-clipboard-heart", label: "Medical Records" },
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
      {/* Stats grid */}`;

let startStr = "function ConfirmDialog({ msg, onConfirm, onCancel }) {";
let endStr = "      {/* Stats grid */}";
let startIndex = ppCode.indexOf(startStr);
let endIndex = ppCode.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  ppCode = ppCode.substring(0, startIndex) + replacementString + ppCode.substring(endIndex + endStr.length);
  fs.writeFileSync(ppPath, ppCode);
  console.log("Successfully fixed PatientPanel.jsx using index replacement!");
} else {
  console.log("Failed to find indices:", startIndex, endIndex);
}
