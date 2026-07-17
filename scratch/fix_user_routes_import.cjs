const fs = require('fs');
const path = require('path');

const urPath = path.join(__dirname, '../backend/routes/user.routes.js');
let code = fs.readFileSync(urPath, 'utf8');

if (!code.includes('getMyPostOpLogs,')) {
  const target = `clearMyNotifications } = require("../controllers/user.controller");`;
  const replacement = `clearMyNotifications, getMyPostOpLogs, submitPostOpLog } = require("../controllers/user.controller");`;
  
  if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync(urPath, code);
    console.log("Fixed user.routes.js imports");
  } else {
    console.log("Could not find target to replace in user.routes.js");
  }
} else {
  console.log("Already imported");
}
