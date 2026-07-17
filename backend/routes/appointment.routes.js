const express = require("express");
const { createAppointment, getMyAppointments, getAppointmentById, getDoctorAppointments } = require("../controllers/appointment.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", protect, createAppointment);
router.get("/my", protect, getMyAppointments);
router.get("/doctor", protect, getDoctorAppointments);
router.get("/:id", protect, getAppointmentById);

module.exports = router;
