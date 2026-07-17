const fs = require('fs');
const path = require('path');

const ppPath = path.join(__dirname, '../src/Pages/Patient/PatientPanel.jsx');
let ppCode = fs.readFileSync(ppPath, 'utf8');

// Check if the button was already added by replace_file_content
if (!ppCode.includes('Upgrade to VIP')) {
  const topbarTarget = `<div className="pp-topbar-right">`;
  const topbarReplacement = `<div className="pp-topbar-right">
              {membershipPlan !== 'Gold Premium' && (
                <button 
                  onClick={() => setTab('membership')} 
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 99, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(245,158,11,0.3)', marginRight: 10 }}
                >
                  <i className="ti ti-crown" /> Upgrade to VIP
                </button>
              )}`;
  ppCode = ppCode.replace(topbarTarget, topbarReplacement);
  
  // Remove from NAV sidebar since the user wants it in the navbar instead
  // The NAV array has: { key: "membership", icon: "ti-crown", label: "ToothEase Care" },
  ppCode = ppCode.replace(/\s*{\s*key:\s*"membership",\s*icon:\s*"ti-crown",\s*label:\s*"ToothEase Care"\s*},/, '');

  fs.writeFileSync(ppPath, ppCode);
  console.log("Updated PatientPanel.jsx with Upgrade to VIP button in Navbar.");
} else {
  console.log("PatientPanel.jsx already has the button.");
}
