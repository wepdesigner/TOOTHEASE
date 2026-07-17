const express = require("express");
const {
  getAdminOverview,
  getAdminUsers,
  getAdminDoctors,
  updateDoctorStatus,
  getAdminAppointments,
  getAdminPayments, createAdminDoctor, updateUserStatus, updateAdminAppointmentStatus, completePayment,
  getMembershipStats,
} = require("../controllers/admin.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

// All routes require authentication and ADMIN role
router.use(protect);
router.use(authorize("ADMIN"));

router.get("/overview", getAdminOverview);
router.get("/users", getAdminUsers);
router.get("/doctors", getAdminDoctors);
router.post("/doctors", createAdminDoctor);
router.patch("/doctors/:id/status", updateDoctorStatus);
router.patch("/users/:id/status", updateUserStatus);
router.get("/appointments", getAdminAppointments);
router.patch("/appointments/:id/status", updateAdminAppointmentStatus);
router.get("/payments", getAdminPayments);
router.patch("/payments/:id/complete", completePayment);

// Memberships MRR
router.get("/memberships/stats", protect, authorize("ADMIN"), getMembershipStats);

module.exports = router;
