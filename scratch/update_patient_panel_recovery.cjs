const fs = require('fs');
const path = require('path');

const ppPath = path.join(__dirname, '../src/Pages/Patient/PatientPanel.jsx');
let code = fs.readFileSync(ppPath, 'utf8');

if (!code.includes('RecoveryMonitor')) {
  // Add import
  const importTarget = `import AiScanner from '../../Components/AiScanner';`;
  const newImport = `import AiScanner from '../../Components/AiScanner';\nimport RecoveryMonitor from '../../Components/RecoveryMonitor';`;
  code = code.replace(importTarget, newImport);
  
  // Add sidebar item
  const sidebarTarget = `<div className={\`pp-side-item \${tab === 'ai_scan' ? 'active' : ''}\`} onClick={() => { setTab('ai_scan'); setSide(false); }}>
            <i className="ti ti-scan" /> <span className="pp-side-text">AI Scanner</span>
            <span className="pp-badge-new">NEW</span>
          </div>`;
  const newSidebarItem = `${sidebarTarget}
          <div className={\`pp-side-item \${tab === 'recovery' ? 'active' : ''}\`} onClick={() => { setTab('recovery'); setSide(false); }}>
            <i className="ti ti-heartbeat" /> <span className="pp-side-text">Recovery Monitor</span>
          </div>`;
  code = code.replace(sidebarTarget, newSidebarItem);
  
  // Add tab render
  const renderTarget = `{tab === 'ai_scan' && <AiScanner />}`;
  const newRender = `{tab === 'ai_scan' && <AiScanner />}
          {tab === 'recovery' && <RecoveryMonitor />}`;
  code = code.replace(renderTarget, newRender);

  fs.writeFileSync(ppPath, code);
  console.log("Added Recovery Monitor to PatientPanel.jsx");
} else {
  console.log("Already added");
}
