const fs = require('fs');
const path = require('path');

const routesPath = path.join(__dirname, '../backend/routes/user.routes.js');
let routesCode = fs.readFileSync(routesPath, 'utf8');

routesCode = routesCode.replace(/authMiddleware/g, 'protect');
// And import logHygieneActivity and getHygieneStats if not properly imported
if (!routesCode.includes('logHygieneActivity')) {
  routesCode = routesCode.replace('submitPostOpLog } = require', 'submitPostOpLog, logHygieneActivity, getHygieneStats } = require');
}

fs.writeFileSync(routesPath, routesCode);
console.log("Fixed authMiddleware to protect in user.routes.js.");
