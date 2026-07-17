const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../src/Pages/Admin/ApiAdminPanel.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add import
if (!content.includes('AdminMemberships')) {
  content = content.replace(
    'import API from "../../services/api";',
    'import API from "../../services/api";\nimport AdminMemberships from "./AdminMemberships";'
  );
}

// 2. Add to TABS
if (!content.includes('key:"memberships"')) {
  content = content.replace(
    '{ key:"payments",  icon:"PA", label:"Payments" },',
    '{ key:"payments",  icon:"PA", label:"Payments" },\n    { key:"memberships", icon:"MR", label:"SaaS MRR" },'
  );
}

// 3. Add to render main area
if (!content.includes('tab === "memberships"')) {
  content = content.replace(
    '{tab === "payments" && renderPayments()}',
    '{tab === "payments" && renderPayments()}\n        {tab === "memberships" && <AdminMemberships />}'
  );
}

fs.writeFileSync(targetFile, content);
console.log("Updated ApiAdminPanel.jsx");
