const express = require("express");
const { getMyConsultations, deleteMyConsultation, getMyHomeVisits, deleteMyPrescription, updateMyConsultationStatus, updateMyHomeVisitStatus, updateMyAppointmentStatus, deleteMyAppointment, getMyDentalRecords, simulateAiScan, updateMe, changePassword, deleteMe, getMyPrescriptions, getMyRecords, getMyPayments, getMyNotifications, deleteMyNotification, clearMyNotifications, getMyPostOpLogs, submitPostOpLog, logHygieneActivity, getHygieneStats, upgradeMembership } = require("../controllers/user.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.patch("/me", protect, updateMe);
router.patch("/me/password", protect, changePassword);
router.delete("/me", protect, deleteMe);
router.get("/me/prescriptions", protect, getMyPrescriptions);
router.get("/me/records", protect, getMyRecords);

router.get("/me/payments", protect, getMyPayments);
router.get("/me/notifications", protect, getMyNotifications);
router.delete("/me/notifications/clear", protect, clearMyNotifications);
router.delete("/me/notifications/:id", protect, deleteMyNotification);


router.get("/me/consultations", protect, getMyConsultations);
router.patch("/me/consultations/:id/status", protect, updateMyConsultationStatus);
router.delete("/me/consultations/:id", protect, deleteMyConsultation);
router.get("/me/home-visits", protect, getMyHomeVisits);
router.patch("/me/home-visits/:id/status", protect, updateMyHomeVisitStatus);
router.delete("/me/prescriptions/:id", protect, deleteMyPrescription);

router.patch("/me/appointments/:id/status", protect, updateMyAppointmentStatus);
router.delete("/me/appointments/:id", protect, deleteMyAppointment);

router.get("/me/dental-records", protect, getMyDentalRecords);

router.post("/me/ai-scan", protect, simulateAiScan);


// Post-Op routes
router.get("/me/post-op-logs", protect, getMyPostOpLogs);
router.post("/me/post-op-logs", protect, submitPostOpLog);

module.exports = router;

// Hygiene Tracker
router.post('/me/hygiene', protect, logHygieneActivity);
router.get('/me/hygiene', protect, getHygieneStats);

// Membership Subscription
router.post('/me/membership/upgrade', protect, upgradeMembership);
