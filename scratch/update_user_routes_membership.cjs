const fs = require('fs');
const path = require('path');

const routesPath = path.join(__dirname, '../backend/routes/user.routes.js');
let routesCode = fs.readFileSync(routesPath, 'utf8');

if (!routesCode.includes('upgradeMembership')) {
  // Update imports if needed
  if (!routesCode.includes('upgradeMembership')) {
    routesCode = routesCode.replace(
      /getHygieneStats\s*}/,
      'getHygieneStats, upgradeMembership }'
    );
  }

  const newRoutes = `
// Membership Subscription
router.post('/me/membership/upgrade', protect, upgradeMembership);
`;

  routesCode += newRoutes;
  fs.writeFileSync(routesPath, routesCode);
  console.log("Updated user.routes.js with membership route.");
} else {
  console.log("user.routes.js already updated.");
}
