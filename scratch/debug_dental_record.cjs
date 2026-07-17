const fs = require('fs');
const path = require('path');

const dcPath = path.join(__dirname, '../backend/controllers/doctor.controller.js');
let dcCode = fs.readFileSync(dcPath, 'utf8');

dcCode = dcCode.replace(
  '} catch (err) { res.status(500).json({ success: false, message: "Server error" }); }',
  '} catch (err) { console.error("DENTAL RECORD ERROR:", err); res.status(500).json({ success: false, message: err.message || "Server error" }); }'
);

fs.writeFileSync(dcPath, dcCode);
console.log("Patched catch block.");
