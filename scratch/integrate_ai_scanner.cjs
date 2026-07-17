const fs = require('fs');
const path = require('path');

const ppPath = path.join(__dirname, '../src/Pages/Patient/PatientPanel.jsx');
let ppCode = fs.readFileSync(ppPath, 'utf8');

// 1. Import AiScanner
if (!ppCode.includes('AiScanner')) {
  ppCode = ppCode.replace(
    'import DentalChart from "../../components/DentalChart";',
    'import DentalChart from "../../components/DentalChart";\nimport AiScanner from "../../components/AiScanner";'
  );
}

// 2. Add to Sidebar
const sidebarNavOld = '<button className={`pp-nav-item ${tab === \'my_chart\' ? \'active\' : \'\'}`} onClick={() => setTab(\'my_chart\')}><i className="ti ti-dental" /> My 3D Chart</button>';
const sidebarNavNew = '<button className={`pp-nav-item ${tab === \'my_chart\' ? \'active\' : \'\'}`} onClick={() => setTab(\'my_chart\')}><i className="ti ti-dental" /> My 3D Chart</button>\n          <button className={`pp-nav-item ${tab === \'ai_scan\' ? \'active\' : \'\'}`} onClick={() => setTab(\'ai_scan\')}><i className="ti ti-brain" /> AI Scanner <span style={{marginLeft:"auto", background:"#3b82f6", color:"white", padding:"2px 6px", borderRadius:4, fontSize:10}}>NEW</span></button>';
ppCode = ppCode.replace(sidebarNavOld, sidebarNavNew);

// 3. Render in Main
const renderOld = '{tab === \'my_chart\' && <PatMyChart {...sp} dentalRecords={dentalRecords} />}';
const renderNew = '{tab === \'my_chart\' && <PatMyChart {...sp} dentalRecords={dentalRecords} />}\n            {tab === \'ai_scan\' && <AiScanner onBookRecommendation={() => setTab("book")} />}';
ppCode = ppCode.replace(renderOld, renderNew);

fs.writeFileSync(ppPath, ppCode);
console.log("PatientPanel integrated with AI Scanner.");
