// src/controllers/appointment.controller.js
const Appointment  = require("../models/Appointment");
const Payment      = require("../models/Payment");
const Doctor       = require("../models/Doctor");
const Notification = require("../models/Notification");
const User         = require("../models/User");

/* ── Helper: create notification ─────────────────────────────────────────── */
const notify = (toId, userId, type, title, body, refId, refModel) =>
  Notification.create({ toId, userId: userId || null, type, title, body, refId, refModel });

/* ══════════════════════════════════════════════════════════════
   POST /api/appointments
   Body: { doctorId, healthType, date, time, notes, isHomeVisit, visitAddress }
   Replaces: addAppt() + admPayDB.add() + admNotify() + docNotify()
══════════════════════════════════════════════════════════════ */
const createAppointment = async (req, res) => {
  try {
    const { doctorId, patientId: bodyPatientId, healthType, date, time, notes, isHomeVisit, visitAddress, isVideoConsultation, roomId, trackingId, paymentMethod, paymentStatus } = req.body;
    
    let patientId = req.user._id;
    let targetDoctorId = doctorId;

    if (req.user.role === "DOCTOR") {
      patientId = bodyPatientId;
      const doc = await Doctor.findOne({ userId: req.user._id });
      if (doc) targetDoctorId = doc._id;
    }

    if (!targetDoctorId || !healthType || !date || !time || !patientId) {
      return res.status(400).json({
        success: false,
        message: "doctorId, patientId, healthType, date, and time are required",
      });
    }

    // Load doctor to get fee + user info
    const doctor = await Doctor.findById(targetDoctorId).populate("userId", "name email");
    if (!doctor || doctor.status !== "ACTIVE") {
      return res.status(404).json({ success: false, message: "Doctor not found or inactive" });
    }

    // Load patient name for notifications
    const patient = await User.findById(patientId).select("name email");

    // Create appointment — single document, replaces dual adm + te stores
    const appointment = await Appointment.create({
      patientId,
      doctorId:    doctor._id,
      healthType,
      date:        new Date(date),
      time,
      notes:       notes || "",
      amount:      doctor.consultFee || 15000,
      status:      "PENDING",
      isHomeVisit: isHomeVisit || false,
      isVideoConsultation: isVideoConsultation || false,
      visitAddress:visitAddress || "",
      roomId: roomId || "",
      trackingId: trackingId || "",
    });

    // Create pending payment record (replaces admPayDB.add)
    const feePct = doctor.commissionPct || 10;
    const adminFee = (doctor.consultFee || 15000) * (feePct / 100);
    const doctorEarnings = (doctor.consultFee || 15000) - adminFee;

    await Payment.create({
      appointmentId: appointment._id,
      patientId,
      doctorId:      doctor._id,
      service:       healthType,
      amount:        doctor.consultFee || 15000,
      method:        "Cash",
      status:        "PENDING",
      forfaitPct:    feePct,
      adminFee,
      doctorEarnings,
    });

    // Notify admin (replaces admNotify)
    await notify(
      "admin", null,
      "appointment",
      "📅 New Appointment",
      `${patient.name} → ${doctor.userId.name} · ${healthType} · ${date} ${time}`,
      appointment._id.toString(),
      "Appointment"
    );

    // Notify doctor (replaces docNotify)
    await notify(
      doctor.userId._id.toString(),
      doctor.userId._id,
      "appointment",
      "New Booking Request",
      `${patient.name} wants ${healthType} on ${date} at ${time}.`,
      appointment._id.toString(),
      "Appointment"
    );

    // Return populated appointment
    const populated = await Appointment.findById(appointment._id)
      .populate({ path: "doctorId", populate: { path: "userId", select: "name email" } })
      .populate("patientId", "name email");

    return res.status(201).json({ success: true, appointment: populated });
  } catch (err) {
    console.error("createAppointment:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════════
   GET /api/appointments/my
   Returns all appointments for the logged-in patient.
   Replaces: getPatientAppts() — no more dual-store deduplication
══════════════════════════════════════════════════════════════ */
const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user._id })
      .populate({ path: "doctorId", populate: { path: "userId", select: "name email avatar" } })
      .sort({ date: 1, time: 1 })
      .lean();

    return res.status(200).json({ success: true, appointments });
  } catch (err) {
    console.error("getMyAppointments:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════════
   GET /api/appointments/:id
══════════════════════════════════════════════════════════════ */
const getAppointmentById = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    let query = {};
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      query = { $or: [{ _id: req.params.id }, { roomId: req.params.id }] };
    } else {
      query = { roomId: req.params.id };
    }

    const appointment = await Appointment.findOne(query)
      .populate({ path: "doctorId", populate: { path: "userId", select: "name email avatar" } })
      .populate("patientId", "name email");

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    // Only the patient or the doctor can view it
    const isPatient = appointment.patientId._id.toString() === req.user._id.toString();
    const isDoctor  = appointment.doctorId?.userId?._id?.toString() === req.user._id.toString();
    const isAdmin   = req.user.role === "ADMIN";

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    return res.status(200).json({ success: true, appointment });
  } catch (err) {
    console.error("getAppointmentById:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════════
   GET /api/appointments/doctor
   Returns all appointments for the logged-in doctor.
══════════════════════════════════════════════════════════════ */
const getDoctorAppointments = async (req, res) => {
  try {
    const Doctor = require("../models/Doctor");
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor profile not found" });

    const appointments = await Appointment.find({ doctorId: doctor._id })
      .populate({ path: "doctorId", populate: { path: "userId", select: "name email avatar" } })
      .populate("patientId", "name email")
      .sort({ date: 1, time: 1 })
      .lean();

    return res.status(200).json({ success: true, appointments });
  } catch (err) {
    console.error("getDoctorAppointments:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { createAppointment, getMyAppointments, getAppointmentById, getDoctorAppointments };
