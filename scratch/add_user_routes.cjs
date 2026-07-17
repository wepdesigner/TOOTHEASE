const fs = require('fs');
const path = require('path');

const urPath = path.join(__dirname, '../backend/routes/user.routes.js');
let code = fs.readFileSync(urPath, 'utf8');

if (!code.includes('submitPostOpLog')) {
  // Extract imports and add the new ones
  const importTarget = `getMyPrescriptions, getMyRecords } = require("../controllers/user.controller");`;
  const newImport = `getMyPrescriptions, getMyRecords, getMyPostOpLogs, submitPostOpLog } = require("../controllers/user.controller");`;
  code = code.replace(importTarget, newImport);
  
  // Add routes near the end
  const routeTarget = `module.exports = router;`;
  const newRoutes = `
// Post-Op routes
router.get("/me/post-op-logs", protect, getMyPostOpLogs);
router.post("/me/post-op-logs", protect, submitPostOpLog);

module.exports = router;`;
  
  code = code.replace(routeTarget, newRoutes);
  
  fs.writeFileSync(urPath, code);
  console.log("Added post-op routes to user.routes.js");
} else {
  console.log("Already added");
}
