const fs = require('fs');
const path = require('path');

const routesPath = path.join(__dirname, '../backend/routes/user.routes.js');
let routesCode = fs.readFileSync(routesPath, 'utf8');

if (!routesCode.includes('logHygieneActivity')) {
  // Update imports if needed
  if (!routesCode.includes('logHygieneActivity')) {
    routesCode = routesCode.replace(
      /submitPostOpLog,\s*getMyPostOpLogs\s*}/,
      'submitPostOpLog, getMyPostOpLogs, logHygieneActivity, getHygieneStats }'
    );
  }

  const newRoutes = `
// Hygiene Tracker
router.post('/me/hygiene', authMiddleware, logHygieneActivity);
router.get('/me/hygiene', authMiddleware, getHygieneStats);
`;

  routesCode += newRoutes;
  fs.writeFileSync(routesPath, routesCode);
  console.log("Updated user.routes.js with hygiene routes.");
} else {
  console.log("user.routes.js already updated.");
}
