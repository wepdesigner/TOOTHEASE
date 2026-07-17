const fs = require('fs');
const path = require('path');

const dpPath = path.join(__dirname, '../src/Pages/Doctor/ApiDoctorPanel.jsx');
let code = fs.readFileSync(dpPath, 'utf8');

if (!code.includes('DoctorSOSAlerts')) {
  // Add import
  const importTarget = `import Avatar from '../../Components/Avatar';`;
  const newImport = `import Avatar from '../../Components/Avatar';\nimport DoctorSOSAlerts from '../../Components/DoctorSOSAlerts';`;
  code = code.replace(importTarget, newImport);
  
  // Add sidebar item
  const sidebarTarget = `<div className={\`dp-side-item \${t === 'home_visits' ? 'active' : ''}\`} onClick={() => st('home_visits')}>
            <i className="ti ti-home-heart" /> <span className="dp-side-text">Home Visits</span>
          </div>`;
  const newSidebarItem = `${sidebarTarget}
          <div className={\`dp-side-item \${t === 'sos' ? 'active' : ''}\`} onClick={() => st('sos')} style={{ color: t === 'sos' ? '#fff' : '#ef4444' }}>
            <i className="ti ti-alert-triangle" /> <span className="dp-side-text">SOS Alerts</span>
            <span className="dp-badge-new" style={{ background: '#ef4444', color: '#fff' }}>!</span>
          </div>`;
  code = code.replace(sidebarTarget, newSidebarItem);
  
  // Add tab render
  const renderTarget = `{t === 'home_visits' && <DocHomeVisits toast={toast} />}`;
  const newRender = `{t === 'home_visits' && <DocHomeVisits toast={toast} />}
          {t === 'sos' && <DoctorSOSAlerts onStartCall={c => { setAct(c); st('video'); }} />}`;
  code = code.replace(renderTarget, newRender);

  fs.writeFileSync(dpPath, code);
  console.log("Added SOS Alerts to ApiDoctorPanel.jsx");
} else {
  console.log("Already added");
}
