const fs = require('fs');
const path = require('path');

const ppPath = path.join(__dirname, '../src/Pages/Patient/PatientPanel.jsx');
let ppCode = fs.readFileSync(ppPath, 'utf8');

if (!ppCode.includes('MembershipPlans')) {
  // 1. Add import
  ppCode = ppCode.replace(
    'import HygieneTracker from "../../Components/HygieneTracker";',
    'import HygieneTracker from "../../Components/HygieneTracker";\nimport MembershipPlans from "../../Components/MembershipPlans";'
  );

  // 2. Add state for membership Plan
  ppCode = ppCode.replace(
    'const [refreshKey, setRefreshKey] = useState(0);',
    'const [refreshKey, setRefreshKey] = useState(0);\n  const [membershipPlan, setMembershipPlan] = useState("Basic");'
  );

  // 3. Set membershipPlan in loadData
  ppCode = ppCode.replace(
    'setUser(me);',
    'setUser(me);\n        if (me.membershipPlan) setMembershipPlan(me.membershipPlan);'
  );

  // 4. Update the sidebar profile block to show badge if Gold Premium
  ppCode = ppCode.replace(
    '{user?.firstName} {user?.lastName}',
    `{user?.firstName} {user?.lastName}
                {membershipPlan === 'Gold Premium' && <div style={{display:'inline-flex', alignItems:'center', background:'linear-gradient(135deg, #f59e0b, #d97706)', color:'#fff', padding:'2px 8px', borderRadius:12, fontSize:10, fontWeight:800, marginLeft:8, letterSpacing:0.5, boxShadow:'0 2px 5px rgba(245,158,11,0.3)'}}><i className="ti ti-star" style={{marginRight:2}}/> VIP</div>}
                {membershipPlan === 'Silver Care' && <div style={{display:'inline-flex', alignItems:'center', background:'#94a3b8', color:'#fff', padding:'2px 8px', borderRadius:12, fontSize:10, fontWeight:800, marginLeft:8, letterSpacing:0.5}}><i className="ti ti-shield" style={{marginRight:2}}/> SILVER</div>}`
  );

  // 5. Add to NAV under Account
  ppCode = ppCode.replace(
    '{ key: "settings", icon: "ti-settings", label: "Settings" },',
    '{ key: "settings", icon: "ti-settings", label: "Settings" },\n    { key: "membership", icon: "ti-crown", label: "ToothEase Care" },'
  );

  // 6. Add to renderer
  ppCode = ppCode.replace(
    "{tab === 'hygiene' && <HygieneTracker />}",
    "{tab === 'hygiene' && <HygieneTracker />}\n          {tab === 'membership' && <MembershipPlans currentPlan={membershipPlan} onPlanUpdate={setMembershipPlan} />}"
  );

  fs.writeFileSync(ppPath, ppCode);
  console.log("Updated PatientPanel.jsx with MembershipPlans.");
} else {
  console.log("PatientPanel.jsx already updated.");
}
