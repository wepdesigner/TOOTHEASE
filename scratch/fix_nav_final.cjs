const fs = require('fs');
const path = require('path');

const ppPath = path.join(__dirname, '../src/Pages/Patient/PatientPanel.jsx');
let ppCode = fs.readFileSync(ppPath, 'utf8');

const targetString = `          <div style={{ display: "flex", gap: 10 }}>
  return (
    <div className="pp-animate">`;

const replacementString = `          <div style={{ display: "flex", gap: 10 }}>
            <button className="pp-btn pp-btn-ghost" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
            <button className="pp-btn pp-btn-danger" style={{ flex: 1 }} onClick={onConfirm}>Confirm</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/*  NAV definition  */
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

/*  PAGE COMPONENTS  simplified to use props  */
function PatOverview({ patient, doctors = [], appointments, consultations, prescriptions, payments, setTab }) {
  const upcoming = appointments.filter(a => a.status !== "cancelled").sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time));
  return (
    <div className="pp-animate">`;

ppCode = ppCode.replace(targetString, replacementString);
fs.writeFileSync(ppPath, ppCode);
console.log("Restored PatientPanel.jsx NAV array.");
