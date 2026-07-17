const fs = require('fs');
const path = require('path');

// 1. Update user.controller.js
const ucPath = path.join(__dirname, '../backend/controllers/user.controller.js');
let ucCode = fs.readFileSync(ucPath, 'utf8');

const newMethods = `
const deleteMyAppointment = async (req, res) => {
  try {
    const Appointment = require("../models/Appointment");
    const appt = await Appointment.findOneAndDelete({ _id: req.params.id, patientId: req.user._id });
    if (!appt) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, message: "Appointment deleted" });
  } catch (err) { res.status(500).json({ success: false, message: "Server error" }); }
};
`;

ucCode = ucCode.replace(
  'const updateMyAppointmentStatus = async (req, res) => {',
  newMethods + '\nconst updateMyAppointmentStatus = async (req, res) => {'
);
ucCode = ucCode.replace(
  'updateMyAppointmentStatus,',
  'updateMyAppointmentStatus,\n  deleteMyAppointment,'
);
fs.writeFileSync(ucPath, ucCode);

// 2. Update user.routes.js
const urPath = path.join(__dirname, '../backend/routes/user.routes.js');
let urCode = fs.readFileSync(urPath, 'utf8');
urCode = urCode.replace(
  'updateMyAppointmentStatus, ',
  'updateMyAppointmentStatus, deleteMyAppointment, '
);
urCode = urCode.replace(
  'router.patch("/me/appointments/:id/status", protect, updateMyAppointmentStatus);',
  'router.patch("/me/appointments/:id/status", protect, updateMyAppointmentStatus);\nrouter.delete("/me/appointments/:id", protect, deleteMyAppointment);'
);
fs.writeFileSync(urPath, urCode);

console.log("Patient Appointment delete added.");
