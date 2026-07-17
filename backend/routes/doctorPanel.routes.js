const express = require("express");
const { getPatientDentalRecords, createDentalRecord } = require("../controllers/doctor.controller");

const {
  getDoctorOverview,
  getDoctorAppointments, updateDoctorAppointment,
  getDoctorPatients,
  getDoctorPrescriptions, createPrescription, updatePrescription, deletePrescription,
  getDoctorSchedule, updateDoctorSchedule,
  getDoctorNotifications,
  getDoctorThread, doctorSendMessage,
  getDoctorProfile, updateDoctorProfile,
  getDoctorRevenue,
  getDoctorPayments, createPayment, updatePayment, deletePayment, deleteNotification, clearNotifications,
  getDoctorConsultations, createDoctorConsultation, updateDoctorConsultation,
  getDoctorHomeVisits, createDoctorHomeVisit, updateDoctorHomeVisit,
  getPatientRecords, createMedicalRecord, updateMedicalRecord, deleteMedicalRecord, getSOSLogs, resolveSOSLog,
} = require("../controllers/doctorPanel.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

// Apply protect and authorize DOCTOR to all routes in this router
router.use(protect);
router.use(authorize("DOCTOR"));

router.get("/overview", getDoctorOverview);

router.get("/appointments", getDoctorAppointments);
router.patch("/appointments/:id/status", updateDoctorAppointment);

router.get("/patients", getDoctorPatients);

router.get("/prescriptions", getDoctorPrescriptions);
router.post("/prescriptions", createPrescription);
router.put("/prescriptions/:id", updatePrescription);
router.delete("/prescriptions/:id", deletePrescription);

router.get("/consultations", getDoctorConsultations);
router.post("/consultations", createDoctorConsultation);
router.patch("/consultations/:id", updateDoctorConsultation);

router.get("/home-visits", getDoctorHomeVisits);
router.post("/home-visits", createDoctorHomeVisit);
router.patch("/home-visits/:id", updateDoctorHomeVisit);

router.get("/patients/:patientId/dental-records", getPatientDentalRecords);
router.post("/dental-records", createDentalRecord);

router.get("/records/:patientId", getPatientRecords);
router.post("/records", createMedicalRecord);
router.put("/records/:id", updateMedicalRecord);
router.delete("/records/:id", deleteMedicalRecord);

router.get("/payments", getDoctorPayments);
router.post("/payments", createPayment);
router.put("/payments/:id", updatePayment);
router.delete("/payments/:id", deletePayment);

router.get("/schedule", getDoctorSchedule);
router.put("/schedule", updateDoctorSchedule);

router.get("/notifications", getDoctorNotifications);

router.get("/messages/:contactId", getDoctorThread);
router.post("/messages", doctorSendMessage);

router.get("/profile", getDoctorProfile);
router.patch("/profile", updateDoctorProfile);

router.get("/revenue", getDoctorRevenue);


// SOS Post-Op routes
router.get("/sos-logs", getSOSLogs);
router.patch("/sos-logs/:id/resolve", resolveSOSLog);

module.exports = router;
