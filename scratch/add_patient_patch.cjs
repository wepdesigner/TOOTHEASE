const fs = require('fs');
const path = require('path');

// 1. Update Consultation Model
const consPath = path.join(__dirname, '../backend/models/Consultation.js');
let consCode = fs.readFileSync(consPath, 'utf8');
consCode = consCode.replace(
  'enum: ["scheduled", "completed", "cancelled"]',
  'enum: ["pending", "accepted", "scheduled", "completed", "declined", "cancelled"]'
);
consCode = consCode.replace(
  'default: "scheduled",',
  'default: "pending",'
);
fs.writeFileSync(consPath, consCode);

// 2. Update user.controller.js
const ucPath = path.join(__dirname, '../backend/controllers/user.controller.js');
let ucCode = fs.readFileSync(ucPath, 'utf8');

const newMethods = `
const updateMyConsultationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const cons = await Consultation.findOneAndUpdate(
      { _id: req.params.id, patientId: req.user._id },
      { status },
      { new: true }
    );
    if (!cons) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, consultation: cons });
  } catch (err) { res.status(500).json({ success: false, message: "Server error" }); }
};

const updateMyHomeVisitStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const hv = await HomeVisit.findOneAndUpdate(
      { _id: req.params.id, patientId: req.user._id },
      { status },
      { new: true }
    );
    if (!hv) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, homeVisit: hv });
  } catch (err) { res.status(500).json({ success: false, message: "Server error" }); }
};
`;

ucCode = ucCode.replace(
  'module.exports = {',
  newMethods + '\nmodule.exports = {\n  updateMyConsultationStatus,\n  updateMyHomeVisitStatus,'
);
fs.writeFileSync(ucPath, ucCode);

// 3. Update user.routes.js
const urPath = path.join(__dirname, '../backend/routes/user.routes.js');
let urCode = fs.readFileSync(urPath, 'utf8');
urCode = urCode.replace(
  'deleteMyPrescription, ',
  'deleteMyPrescription, updateMyConsultationStatus, updateMyHomeVisitStatus, '
);
urCode = urCode.replace(
  'router.get("/me/consultations", protect, getMyConsultations);',
  'router.get("/me/consultations", protect, getMyConsultations);\nrouter.patch("/me/consultations/:id/status", protect, updateMyConsultationStatus);'
);
urCode = urCode.replace(
  'router.get("/me/home-visits", protect, getMyHomeVisits);',
  'router.get("/me/home-visits", protect, getMyHomeVisits);\nrouter.patch("/me/home-visits/:id/status", protect, updateMyHomeVisitStatus);'
);
fs.writeFileSync(urPath, urCode);

console.log("Backend updated successfully.");
