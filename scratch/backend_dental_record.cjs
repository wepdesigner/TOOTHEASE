const fs = require('fs');
const path = require('path');

// 1. Create DentalRecord Model
const modelCode = `const mongoose = require("mongoose");

const DentalRecordSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    toothId: { type: String, required: true }, // e.g. "11", "48"
    condition: { 
      type: String, 
      enum: ["Healthy", "Cavity", "Crown", "Extracted", "Implant", "Filling", "Root Canal", "Veneer", "Bridge", "Watch"], 
      required: true 
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DentalRecord", DentalRecordSchema);
`;
fs.writeFileSync(path.join(__dirname, '../backend/models/DentalRecord.js'), modelCode);

// 2. Update user.controller.js
const ucPath = path.join(__dirname, '../backend/controllers/user.controller.js');
let ucCode = fs.readFileSync(ucPath, 'utf8');
const ucNewMethod = `
const getMyDentalRecords = async (req, res) => {
  try {
    const DentalRecord = require("../models/DentalRecord");
    const records = await DentalRecord.find({ patientId: req.user._id }).populate("doctorId", "userId").sort({ createdAt: -1 });
    res.status(200).json({ success: true, dentalRecords: records });
  } catch (err) { res.status(500).json({ success: false, message: "Server error" }); }
};
`;
ucCode = ucCode.replace('deleteMyAppointment,', 'deleteMyAppointment,\n  getMyDentalRecords,');
ucCode = ucCode.replace('const deleteMyAppointment = async', ucNewMethod + '\nconst deleteMyAppointment = async');
fs.writeFileSync(ucPath, ucCode);

// 3. Update user.routes.js
const urPath = path.join(__dirname, '../backend/routes/user.routes.js');
let urCode = fs.readFileSync(urPath, 'utf8');
urCode = urCode.replace('deleteMyAppointment, ', 'deleteMyAppointment, getMyDentalRecords, ');
urCode = urCode.replace('module.exports = router;', 'router.get("/me/dental-records", protect, getMyDentalRecords);\n\nmodule.exports = router;');
fs.writeFileSync(urPath, urCode);


// 4. Update doctor.controller.js
const dcPath = path.join(__dirname, '../backend/controllers/doctor.controller.js');
let dcCode = fs.readFileSync(dcPath, 'utf8');
const dcNewMethods = `
const getPatientDentalRecords = async (req, res) => {
  try {
    const DentalRecord = require("../models/DentalRecord");
    const records = await DentalRecord.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, dentalRecords: records });
  } catch (err) { res.status(500).json({ success: false, message: "Server error" }); }
};

const createDentalRecord = async (req, res) => {
  try {
    const DentalRecord = require("../models/DentalRecord");
    const doc = await Doctor.findOne({ userId: req.user._id });
    if (!doc) return res.status(404).json({ success: false, message: "Not a doctor" });
    
    const { patientId, toothId, condition, notes } = req.body;
    
    // We can either create a new one, or if it's just a state update, maybe we just want an append log. Let's just create a new record which acts as a history.
    const record = await DentalRecord.create({
      doctorId: doc._id,
      patientId,
      toothId,
      condition,
      notes
    });
    res.status(201).json({ success: true, dentalRecord: record });
  } catch (err) { res.status(500).json({ success: false, message: "Server error" }); }
};
`;
dcCode = dcCode.replace('module.exports = {', dcNewMethods + '\nmodule.exports = {\n  getPatientDentalRecords,\n  createDentalRecord,');
fs.writeFileSync(dcPath, dcCode);

// 5. Update doctor.routes.js
const drPath = path.join(__dirname, '../backend/routes/doctor.routes.js');
let drCode = fs.readFileSync(drPath, 'utf8');
drCode = drCode.replace('const {', 'const { getPatientDentalRecords, createDentalRecord, ');
drCode = drCode.replace('module.exports = router;', 'router.get("/patients/:patientId/dental-records", protect, getPatientDentalRecords);\nrouter.post("/dental-records", protect, createDentalRecord);\n\nmodule.exports = router;');
fs.writeFileSync(drPath, drCode);

console.log("Backend DentalRecords setup complete.");
