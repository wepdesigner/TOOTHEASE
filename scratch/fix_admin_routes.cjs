const fs = require('fs');
const path = require('path');

const routesPath = path.join(__dirname, '../backend/routes/admin.routes.js');
let routesCode = fs.readFileSync(routesPath, 'utf8');

// Add getMembershipStats to the destructured imports
if (!routesCode.includes('getMembershipStats,')) {
  routesCode = routesCode.replace(
    '} = require("../controllers/admin.controller");',
    '  getMembershipStats,\n} = require("../controllers/admin.controller");'
  );
}

// Replace adminController.getMembershipStats with getMembershipStats
routesCode = routesCode.replace('adminController.getMembershipStats', 'getMembershipStats');

fs.writeFileSync(routesPath, routesCode);
console.log("Fixed admin.routes.js");
