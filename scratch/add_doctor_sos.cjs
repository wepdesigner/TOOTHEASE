const fs = require('fs');
const path = require('path');

const dpcPath = path.join(__dirname, '../backend/controllers/doctorPanel.controller.js');
let code = fs.readFileSync(dpcPath, 'utf8');

if (!code.includes('getSOSLogs')) {
  const inject = `
const getSOSLogs = async (req, res) => {
  try {
    const PostOpLog = require("../models/PostOpLog");
    // Find logs where SOS was triggered
    const logs = await PostOpLog.find({ sosTriggered: true }).populate("patientId", "name email avatar").sort({ createdAt: -1 });
    res.status(200).json({ success: true, sosLogs: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const resolveSOSLog = async (req, res) => {
  try {
    const PostOpLog = require("../models/PostOpLog");
    const log = await PostOpLog.findByIdAndUpdate(req.params.id, { sosTriggered: false }, { new: true });
    res.status(200).json({ success: true, log });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
`;
  
  const exportsStr = `module.exports = {`;
  code = code.replace(exportsStr, inject + exportsStr);
  
  const newExportsStr = `module.exports = {
  getSOSLogs,
  resolveSOSLog,`;
  code = code.replace(exportsStr, newExportsStr);

  fs.writeFileSync(dpcPath, code);
  console.log("Injected SOS methods into doctorPanel.controller.js");
} else {
  console.log("Already injected!");
}
