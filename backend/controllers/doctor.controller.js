// src/controllers/doctor.controller.js
const Doctor = require("../models/Doctor");

/* ── GET /api/doctors ───────────────────────────────────────────────────────
   Returns all ACTIVE doctors with user info populated.
   Used by: Register.jsx Step 3 (choose doctor) + DashBook
──────────────────────────────────────────────────────────────────────────── */
const getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ status: "ACTIVE" })
      .populate("userId", "name email phone avatar status")
      .lean();

    // Shape response to match what Register.jsx expects
    const shaped = doctors.map((d) => ({
      _id:       d._id,
      id:        d._id,                   // keep both for compatibility
      name:      d.userId?.name || "",
      email:     d.userId?.email || "",
      specialty: d.specialty,
      experience:d.experience || "",
      location:  d.location || "",
      bio:       d.bio || "",
      rating:    d.rating,
      consultFee:d.consultFee,
      color:     d.color || "#1e88e5",
      status:    d.status.toLowerCase(),
      user:      d.userId,               // full user object for components that use d.user.name
    }));

    return res.status(200).json({ success: true, doctors: shaped });
  } catch (err) {
    console.error("getDoctors:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ── GET /api/doctors/:id ───────────────────────────────────────────────── */
const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate("userId", "name email phone avatar")
      .lean();

    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    return res.status(200).json({
      success: true,
      doctor: {
        ...doctor,
        id:   doctor._id,
        name: doctor.userId?.name || "",
        user: doctor.userId,
      },
    });
  } catch (err) {
    console.error("getDoctorById:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


const getPatientDentalRecords = async (req, res) => {
  try {
    const DentalRecord = require("../models/DentalRecord");
    const records = await DentalRecord.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, dentalRecords: records });
  } catch (err) { console.error("DENTAL RECORD ERROR:", err); res.status(500).json({ success: false, message: err.message || "Server error" }); }
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

module.exports = {
  getPatientDentalRecords,
  createDentalRecord, getDoctors, getDoctorById };
