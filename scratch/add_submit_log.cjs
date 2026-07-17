const fs = require('fs');
const path = require('path');

const ucPath = path.join(__dirname, '../backend/controllers/user.controller.js');
let code = fs.readFileSync(ucPath, 'utf8');

if (!code.includes('submitPostOpLog')) {
  // We need to inject the methods at the end before module.exports
  
  const inject = `
const getMyPostOpLogs = async (req, res) => {
  try {
    const PostOpLog = require("../models/PostOpLog");
    const logs = await PostOpLog.find({ patientId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, postOpLogs: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const submitPostOpLog = async (req, res) => {
  try {
    const PostOpLog = require("../models/PostOpLog");
    const { procedureName, dayNumber, painLevel, notes, photoUrl, doctorId } = req.body;
    
    // Automatically trigger SOS if pain is high
    const sosTriggered = parseInt(painLevel) >= 8;

    const newLog = await PostOpLog.create({
      patientId: req.user._id,
      doctorId,
      procedureName,
      dayNumber,
      painLevel,
      notes,
      photoUrl,
      sosTriggered
    });

    res.status(201).json({ success: true, postOpLog: newLog, sosTriggered });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

`;
  
  const exportsStr = `module.exports = {`;
  code = code.replace(exportsStr, inject + exportsStr);
  
  // also add them to exports
  const newExportsStr = `module.exports = {
  getMyPostOpLogs,
  submitPostOpLog,`;
  code = code.replace(exportsStr, newExportsStr);

  fs.writeFileSync(ucPath, code);
  console.log("Injected PostOp methods into user.controller.js");
} else {
  console.log("Already injected!");
}
