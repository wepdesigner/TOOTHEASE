const express = require("express");
const { getPatientDentalRecords, createDentalRecord,  getDoctors, getDoctorById } = require("../controllers/doctor.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

// Public or protected depending on design, assuming public to view doctors
router.get("/", getDoctors);
router.get("/:id", getDoctorById);

router.get("/patients/:patientId/dental-records", protect, getPatientDentalRecords);
router.post("/dental-records", protect, createDentalRecord);

module.exports = router;
