const fs = require('fs');
const path = require('path');

const ppPath = path.join(__dirname, '../src/Pages/Patient/PatientPanel.jsx');
let ppCode = fs.readFileSync(ppPath, 'utf8');

// 1. Import DentalChart
if (!ppCode.includes('DentalChart')) {
  ppCode = ppCode.replace(
    'import { useNavigate } from "react-router-dom";',
    'import { useNavigate } from "react-router-dom";\nimport DentalChart from "../../components/DentalChart";'
  );
}

// 2. Add State and Fetch
if (!ppCode.includes('dentalRecords')) {
  ppCode = ppCode.replace(
    'const [notifications, setNotifications] = useState([]);',
    'const [notifications, setNotifications] = useState([]);\n  const [dentalRecords, setDentalRecords] = useState([]);'
  );

  const fetchOld = 'setNotifications(notiRes.data.notifications);';
  const fetchNew = 'setNotifications(notiRes.data.notifications);\n        const drRes = await API.get("/users/me/dental-records");\n        if (drRes.data.success) setDentalRecords(drRes.data.dentalRecords);';
  ppCode = ppCode.replace(fetchOld, fetchNew);
}

// 3. Add to Sidebar
const sidebarNavOld = '<button className={`pp-nav-item ${tab === \'overview\' ? \'active\' : \'\'}`} onClick={() => setTab(\'overview\')}><i className="ti ti-layout-dashboard" /> Overview</button>';
const sidebarNavNew = '<button className={`pp-nav-item ${tab === \'overview\' ? \'active\' : \'\'}`} onClick={() => setTab(\'overview\')}><i className="ti ti-layout-dashboard" /> Overview</button>\n          <button className={`pp-nav-item ${tab === \'my_chart\' ? \'active\' : \'\'}`} onClick={() => setTab(\'my_chart\')}><i className="ti ti-dental" /> My 3D Chart</button>';
ppCode = ppCode.replace(sidebarNavOld, sidebarNavNew);

// 4. Render in Main
const renderOld = '{tab === \'overview\' && <PatOverview {...sp} appointments={appointments} consultations={combinedConsultations} prescriptions={prescriptions} payments={payments} doctors={doctors} />}';
const renderNew = '{tab === \'overview\' && <PatOverview {...sp} appointments={appointments} consultations={combinedConsultations} prescriptions={prescriptions} payments={payments} doctors={doctors} />}\n            {tab === \'my_chart\' && <PatMyChart {...sp} dentalRecords={dentalRecords} />}';
ppCode = ppCode.replace(renderOld, renderNew);

// 5. Add PatMyChart component at the bottom
const myChartComp = `
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
`;
ppCode = ppCode + myChartComp;

fs.writeFileSync(ppPath, ppCode);
console.log("PatientPanel integrated with DentalChart.");
