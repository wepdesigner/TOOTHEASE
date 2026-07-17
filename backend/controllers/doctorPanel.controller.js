// src/controllers/doctorPanel.controller.js
// Covers everything DoctorPanel.jsx needs — all from the doctor's own perspective
// Replaces: doc_appointments, doc_patients, doc_prescriptions, doc_schedule, doc_homevisits, te_notifs

const Appointment = require("../models/Appointment");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Prescription = require("../models/Prescription");
const Notification = require("../models/Notification");
const Message = require("../models/Message");
const Payment = require("../models/Payment");

/* ── Helper: get doctor profile from logged-in userId ─────────────────── */
const getMyDoctor = async (userId) => {
  const doctor = await Doctor.findOne({ userId })
    .populate("userId", "name email phone avatar");
  if (!doctor) throw new Error("Doctor profile not found");
  return doctor;
};

/* ══════════════════════════════════════════════════════════════
   GET /api/doctor/overview
   Replaces: DoctorPanel overview stats read from localStorage
══════════════════════════════════════════════════════════════ */
const getDoctorOverview = async (req, res) => {
  try {
    const doctor = await getMyDoctor(req.user._id);

    const [appointments, unreadNotifs, unreadMsgs] = await Promise.all([
      Appointment.find({ doctorId: doctor._id })
        .populate("patientId", "name email phone bloodType")
        .sort({ date: -1 })
        .lean(),
      Notification.countDocuments({ toId: req.user._id.toString(), read: false }),
      Message.countDocuments({ receiverId: req.user._id.toString(), read: false }),
    ]);

    const stats = {
      total: appointments.length,
      pending: appointments.filter(a => a.status === "PENDING").length,
      confirmed: appointments.filter(a => a.status === "CONFIRMED").length,
      completed: appointments.filter(a => a.status === "COMPLETED").length,
      cancelled: appointments.filter(a => a.status === "CANCELLED").length,
      revenue: doctor.revenue || 0,
      unreadNotifs,
      unreadMsgs,
    };

    const recent = appointments.slice(0, 6);

    // Unique patients
    const patientIds = [...new Set(appointments.map(a => a.patientId?._id?.toString()))];
    const totalPatients = patientIds.length;

    return res.json({ success: true, stats: { ...stats, totalPatients }, recentAppointments: recent, doctor });
  } catch (err) {
    console.error("getDoctorOverview:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════════
   GET /api/doctor/appointments?status=&search=
   Replaces: doc_appointments localStorage key
══════════════════════════════════════════════════════════════ */
const getDoctorAppointments = async (req, res) => {
  try {
    const doctor = await getMyDoctor(req.user._id);
    const { status, search } = req.query;

    const query = { doctorId: doctor._id };
    if (status && status !== "all") query.status = status.toUpperCase();

    let appointments = await Appointment.find(query)
      .populate("patientId", "name email phone bloodType dob allergies")
      .sort({ date: 1, time: 1 })
      .lean();

    if (search) {
      const s = search.toLowerCase();
      appointments = appointments.filter(a =>
        a.patientId?.name?.toLowerCase().includes(s) ||
        a.healthType?.toLowerCase().includes(s)
      );
    }

    const shaped = appointments.map(a => ({
      ...a,
      id: a._id,
      patientName: a.patientId?.name || "",
      date: new Date(a.date).toISOString().split("T")[0],
    }));

    return res.json({ success: true, appointments: shaped });
  } catch (err) {
    console.error("getDoctorAppointments:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════════
   PATCH /api/doctor/appointments/:id/status
   Doctor can confirm or complete their own appointments
══════════════════════════════════════════════════════════════ */
const updateDoctorAppointment = async (req, res) => {
  try {
    const doctor = await getMyDoctor(req.user._id);
    const { status, notes } = req.body;

    const allowed = ["CONFIRMED", "COMPLETED", "CANCELLED"];
    if (!allowed.includes(status?.toUpperCase())) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const appt = await Appointment.findOne({ _id: req.params.id, doctorId: doctor._id });
    if (!appt) return res.status(404).json({ success: false, message: "Appointment not found" });

    appt.status = status.toUpperCase();
    if (notes) appt.adminNotes = notes;
    await appt.save();

    // If completed or cancelled, update the payment
    const Payment = require("../models/Payment");
    if (status.toUpperCase() === "COMPLETED") {
      const payment = await Payment.findOneAndUpdate(
        { appointmentId: appt._id },
        { status: "COMPLETED" },
        { new: true }
      );
      if (payment) {
        doctor.revenue = (doctor.revenue || 0) + (payment.doctorEarnings || 0);
        await doctor.save();
      }
    } else if (status.toUpperCase() === "CANCELLED") {
      await Payment.findOneAndUpdate(
        { appointmentId: appt._id },
        { status: "FAILED" }
      );
    }

    // Notify patient
    await Notification.create({
      toId: appt.patientId.toString(),
      userId: appt.patientId,
      type: "appointment",
      title: "Appointment Update",
      body: `Your appointment has been ${status.toLowerCase()} by your doctor.`,
      refId: appt._id.toString(),
      refModel: "Appointment",
    });

    return res.json({ success: true, appointment: appt });
  } catch (err) {
    console.error("updateDoctorAppointment:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════════
   GET /api/doctor/patients
   Replaces: doc_patients — unique patients who booked this doctor
══════════════════════════════════════════════════════════════ */
const getDoctorPatients = async (req, res) => {
  try {
    const doctor = await getMyDoctor(req.user._id);

    const appointments = await Appointment.find({ doctorId: doctor._id })
      .populate("patientId", "name email phone bloodType dob allergies country membership plan")
      .lean();

    // Deduplicate patients
    const seen = new Set();
    const patients = [];
    for (const a of appointments) {
      const pid = a.patientId?._id?.toString();
      if (pid && !seen.has(pid)) {
        seen.add(pid);
        const apptCount = appointments.filter(x => x.patientId?._id?.toString() === pid).length;
        patients.push({ ...a.patientId, id: a.patientId._id, appointmentCount: apptCount });
      }
    }

    return res.json({ success: true, patients });
  } catch (err) {
    console.error("getDoctorPatients:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════════
   GET /api/doctor/prescriptions
   POST /api/doctor/prescriptions
   Replaces: doc_prescriptions localStorage
══════════════════════════════════════════════════════════════ */
const getDoctorPrescriptions = async (req, res) => {
  try {
    const doctor = await getMyDoctor(req.user._id);

    const prescriptions = await Prescription.find({ doctorId: doctor._id })
      .sort({ createdAt: -1 })
      .lean();

    // Enrich with patient name
    const enriched = await Promise.all(prescriptions.map(async (p) => {
      const patient = await User.findById(p.patientId).select("name email").lean();
      return { ...p, id: p._id, patientName: patient?.name || "" };
    }));

    return res.json({ success: true, prescriptions: enriched });
  } catch (err) {
    console.error("getDoctorPrescriptions:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const createPrescription = async (req, res) => {
  try {
    const doctor = await getMyDoctor(req.user._id);
    const { patientId, appointmentId, diagnosis, medicines, notes } = req.body;

    if (!patientId) return res.status(400).json({ success: false, message: "patientId required" });

    const prescription = await Prescription.create({
      doctorId: doctor._id,
      patientId,
      appointmentId: appointmentId || undefined,
      diagnosis: diagnosis || "",
      medicines: medicines || [],
      notes: notes || "",
    });

    // Notify patient
    await Notification.create({
      toId: patientId.toString(),
      userId: patientId,
      type: "system",
      title: "New Prescription",
      body: `Dr. ${req.user.name} has issued a new prescription for you.`,
      refId: prescription._id.toString(),
      refModel: "Prescription",
    });

    return res.status(201).json({ success: true, prescription });
  } catch (err) {
    console.error("createPrescription:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updatePrescription = async (req, res) => {
  try {
    const doctor = await getMyDoctor(req.user._id);
    const { id } = req.params;
    const { diagnosis, medicines, notes } = req.body;
    
    const prescription = await Prescription.findOneAndUpdate(
      { _id: id, doctorId: doctor._id },
      { diagnosis, medicines, notes },
      { new: true }
    );
    
    if (!prescription) return res.status(404).json({ success: false, message: "Prescription not found" });
    return res.json({ success: true, prescription });
  } catch (err) {
    console.error("updatePrescription:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const deletePrescription = async (req, res) => {
  try {
    const doctor = await getMyDoctor(req.user._id);
    const { id } = req.params;
    
    const deleted = await Prescription.findOneAndDelete({ _id: id, doctorId: doctor._id });
    if (!deleted) return res.status(404).json({ success: false, message: "Prescription not found" });
    
    return res.json({ success: true, message: "Prescription deleted" });
  } catch (err) {
    console.error("deletePrescription:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════════
   GET /api/doctor/schedule
   PUT /api/doctor/schedule
   Replaces: doc_schedule localStorage
══════════════════════════════════════════════════════════════ */
const getDoctorSchedule = async (req, res) => {
  try {
    const doctor = await getMyDoctor(req.user._id);
    return res.json({ success: true, schedule: doctor.schedule || [] });
  } catch (err) {
    console.error("getDoctorSchedule:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateDoctorSchedule = async (req, res) => {
  try {
    const doctor = await getMyDoctor(req.user._id);
    const { schedule } = req.body; // array of { dayOfWeek, startTime, endTime, available }

    if (!Array.isArray(schedule)) {
      return res.status(400).json({ success: false, message: "schedule must be an array" });
    }

    await Doctor.findByIdAndUpdate(doctor._id, { schedule });
    return res.json({ success: true, message: "Schedule updated" });
  } catch (err) {
    console.error("updateDoctorSchedule:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════════
   GET /api/doctor/notifications
   Replaces: te_notifs filtered by doctorId
══════════════════════════════════════════════════════════════ */
const getDoctorNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ toId: req.user._id.toString() })
      .sort({ createdAt: -1 })
      .lean();

    // Mark all as read
    await Notification.updateMany(
      { toId: req.user._id.toString(), read: false },
      { read: true, readAt: new Date() }
    );

    return res.json({ success: true, notifications });
  } catch (err) {
    console.error("getDoctorNotifications:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════════
   GET /api/doctor/messages/:contactId
   POST /api/doctor/messages
   Doctor sends/receives messages (same Message model, different perspective)
══════════════════════════════════════════════════════════════ */

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Notification.findOneAndDelete({ _id: id, toId: req.user._id.toString() });
    if (!deleted) return res.status(404).json({ success: false, message: "Notification not found" });
    res.json({ success: true, message: "Notification deleted" });
  } catch (err) {
    console.error("deleteNotification error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const clearNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ toId: req.user._id.toString() });
    res.json({ success: true, message: "Notifications cleared" });
  } catch (err) {
    console.error("clearNotifications error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getDoctorThread = async (req, res) => {
  try {
    const myId = req.user._id.toString();
    let contactId = req.params.contactId;
    if (contactId === "admin") {
      const adminUser = await User.findOne({ role: "ADMIN" });
      if (adminUser) contactId = adminUser._id.toString();
    }

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: contactId },
        { senderId: contactId, receiverId: myId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("senderId", "name role")
      .lean();

    const shaped = messages.map(m => ({
      id: m._id,
      from: m.senderId._id.toString() === myId ? "doctor" : m.senderId.role.toLowerCase(),
      text: m.text,
      ts: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: m.read,
    }));

    // Mark received as read
    await Message.updateMany(
      { senderId: contactId, receiverId: myId, read: false },
      { read: true, readAt: new Date() }
    );

    return res.json({ success: true, messages: shaped });
  } catch (err) {
    console.error("getDoctorThread:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const doctorSendMessage = async (req, res) => {
  try {
    let { receiverId, text } = req.body;
    if (receiverId === "admin") {
      const adminUser = await User.findOne({ role: "ADMIN" });
      if (adminUser) receiverId = adminUser._id.toString();
    }
    if (!receiverId || !text?.trim()) {
      return res.status(400).json({ success: false, message: "receiverId and text required" });
    }

    const message = await Message.create({
      senderId: req.user._id,
      receiverId,
      text: text.trim(),
    });

    await Notification.create({
      toId: receiverId,
      userId: receiverId === "admin" ? null : receiverId,
      type: "message",
      title: `Message from Dr. ${req.user.name}`,
      body: text.trim().slice(0, 80),
      refId: message._id.toString(),
      refModel: "Message",
    });

    return res.status(201).json({
      success: true,
      message: {
        id: message._id,
        from: "doctor",
        text: message.text,
        ts: new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        read: false,
      },
    });
  } catch (err) {
    console.error("doctorSendMessage:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════════
   GET /api/doctor/profile
   PATCH /api/doctor/profile
   Doctor updates their own profile
══════════════════════════════════════════════════════════════ */
const getDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id })
      .populate("userId", "name email phone avatar status");
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor profile not found" });

    return res.json({ success: true, doctor, user: doctor.userId });
  } catch (err) {
    console.error("getDoctorProfile:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateDoctorProfile = async (req, res) => {
  try {
    const { name, phone, specialty, location, experience, bio } = req.body;

    // Update User record
    if (name || phone) {
      await User.findByIdAndUpdate(req.user._id, {
        ...(name && { name }),
        ...(phone && { phone }),
      });
    }

    // Update Doctor profile
    const doctor = await Doctor.findOneAndUpdate(
      { userId: req.user._id },
      {
        ...(specialty && { specialty }),
        ...(location && { location }),
        ...(experience && { experience }),
        ...(bio && { bio }),
      },
      { new: true }
    ).populate("userId", "name email phone");

    return res.json({ success: true, doctor });
  } catch (err) {
    console.error("updateDoctorProfile:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════════
   GET /api/doctor/payments
   Doctor's own payments list (all, not just paid)
══════════════════════════════════════════════════════════════ */
const getDoctorPayments = async (req, res) => {
  try {
    const doctor = await getMyDoctor(req.user._id);

    const payments = await Payment.find({ doctorId: doctor._id })
      .populate("patientId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const shaped = payments.map(p => ({
      id: p._id,
      patientName: p.patientId?.name || "",
      service: p.service,
      amount: p.amount,
      status: p.status === "COMPLETED" ? "paid" : p.status === "PENDING" ? "pending" : "failed",
      date: new Date(p.createdAt).toISOString().split("T")[0],
    }));

    return res.json({ success: true, payments: shaped });
  } catch (err) {
    console.error("getDoctorPayments:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════════
   GET /api/doctor/revenue
   Doctor's dynamic revenue calculations from completed payments
   ══════════════════════════════════════════════════════════════ */

const createPayment = async (req, res) => {
  try {
    const doctor = await getMyDoctor(req.user._id);
    const { patientId, service, amount, method, status } = req.body;
    
    if (!patientId || !service || !amount) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const payment = await Payment.create({
      patientId,
      doctorId: doctor._id,
      service,
      amount: Number(amount),
      method: method || "Cash",
      status: status || "COMPLETED",
      doctorEarnings: Number(amount) * 0.9 // Simple logic
    });

    res.status(201).json({ success: true, payment });
  } catch (err) {
    console.error("createPayment error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updatePayment = async (req, res) => {
  try {
    const doctor = await getMyDoctor(req.user._id);
    const { id } = req.params;
    const { service, amount, method, status } = req.body;

    const payment = await Payment.findOneAndUpdate(
      { _id: id, doctorId: doctor._id },
      { service, amount: Number(amount), method, status, doctorEarnings: Number(amount) * 0.9 },
      { new: true }
    );

    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });
    res.json({ success: true, payment });
  } catch (err) {
    console.error("updatePayment error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deletePayment = async (req, res) => {
  try {
    const doctor = await getMyDoctor(req.user._id);
    const { id } = req.params;

    const deleted = await Payment.findOneAndDelete({ _id: id, doctorId: doctor._id });
    if (!deleted) return res.status(404).json({ success: false, message: "Payment not found" });

    res.json({ success: true, message: "Payment deleted" });
  } catch (err) {
    console.error("deletePayment error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getDoctorRevenue = async (req, res) => {
  try {
    const doctor = await getMyDoctor(req.user._id);
    const payments = await Payment.find({ doctorId: doctor._id, status: "COMPLETED" });
    const totalRevenue = payments.reduce((sum, p) => sum + (p.doctorEarnings || 0), 0);
    return res.json({ success: true, revenue: totalRevenue });
  } catch (err) {
    console.error("getDoctorRevenue:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════════
   GET /api/doctor/consultations
   POST /api/doctor/consultations
   Replaces: consultDB in DoctorPanel
══════════════════════════════════════════════════════════════ */
const Consultation = require("../models/Consultation");

const getDoctorConsultations = async (req, res) => {
  try {
    const doctor = await getMyDoctor(req.user._id);

    const consultations = await Consultation.find({ doctorId: doctor._id })
      .populate("patientId", "name email")
      .sort({ date: 1, time: 1 })
      .lean();

    const shaped = consultations.map(c => ({
      ...c,
      id: c._id,
      patientName: c.patientId?.name || "",
      date: new Date(c.date).toISOString().split("T")[0],
    }));

    return res.json({ success: true, consultations: shaped });
  } catch (err) {
    console.error("getDoctorConsultations:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const createDoctorConsultation = async (req, res) => {
  try {
    const doctor = await getMyDoctor(req.user._id);
    const { patientId, type, date, time, notes } = req.body;

    if (!patientId || !date) {
      return res.status(400).json({ success: false, message: "patientId and date required" });
    }

    const patient = await User.findById(patientId).select("name");

    const consultation = await Consultation.create({
      doctorId: doctor._id,
      patientId,
      type: type || "video",
      date: new Date(date),
      time: time || "10:00",
      notes: notes || "",
      status: "scheduled",
      doctorInitiated: true,
      patientAlerted: false,
      doctorAlerted: false,
    });

    // Notify patient
    await Notification.create({
      toId: patientId.toString(),
      userId: patientId,
      type: "consultation",
      title: "Video Consultation Scheduled",
      body: `Dr. ${req.user.name} scheduled a ${type} session on ${date} at ${time}. You'll get a call alert when the doctor joins.`,
      refId: consultation._id.toString(),
      refModel: "Consultation",
    });

    // Notify admin
    await Notification.create({
      toId: "admin", userId: null,
      type: "consultation",
      title: "New Consultation",
      body: `${patient?.name} with ${req.user.name} on ${date}.`,
      refId: consultation._id.toString(),
      refModel: "Consultation",
    });

    return res.status(201).json({
      success: true,
      consultation: {
        ...consultation.toObject(),
        id: consultation._id,
        patientName: patient?.name || "",
        date: new Date(consultation.date).toISOString().split("T")[0],
      },
    });
  } catch (err) {
    console.error("createDoctorConsultation:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════════
   PATCH /api/doctor/consultations/:id
   Update consultation status
══════════════════════════════════════════════════════════════ */
const updateDoctorConsultation = async (req, res) => {
  try {
    const doctor = await getMyDoctor(req.user._id);
    const { status } = req.body;

    if (!["scheduled", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const consultation = await Consultation.findOneAndUpdate(
      { _id: req.params.id, doctorId: doctor._id },
      { status },
      { new: true }
    );

    if (!consultation) {
      return res.status(404).json({ success: false, message: "Consultation not found" });
    }

    return res.json({ success: true, consultation });
  } catch (err) {
    console.error("updateDoctorConsultation:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════════
   GET /api/doctor/home-visits
   POST /api/doctor/home-visits
   PATCH /api/doctor/home-visits/:id
   Replaces: homeVisitDB in DoctorPanel
══════════════════════════════════════════════════════════════ */
const HomeVisit = require("../models/HomeVisit");

const getDoctorHomeVisits = async (req, res) => {
  try {
    const doctor = await getMyDoctor(req.user._id);

    const visits = await HomeVisit.find({ doctorId: doctor._id })
      .populate("patientId", "name email phone address")
      .sort({ date: 1, time: 1 })
      .lean();

    const shaped = visits.map(v => ({
      ...v,
      id: v._id,
      patientName: v.patientId?.name || "",
      date: new Date(v.date).toISOString().split("T")[0],
    }));

    return res.json({ success: true, homeVisits: shaped });
  } catch (err) {
    console.error("getDoctorHomeVisits:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const createDoctorHomeVisit = async (req, res) => {
  try {
    const doctor = await getMyDoctor(req.user._id);
    const { patientId, address, date, time, service, notes } = req.body;

    if (!patientId || !date || !address) {
      return res.status(400).json({ success: false, message: "patientId, date, and address required" });
    }

    const patient = await User.findById(patientId).select("name");

    const visit = await HomeVisit.create({
      doctorId: doctor._id,
      patientId,
      address,
      date: new Date(date),
      time: time || "09:00",
      service: service || "",
      notes: notes || "",
      status: "scheduled",
      createdByDoctor: true,
    });

    // Notify patient
    await Notification.create({
      toId: patientId.toString(),
      userId: patientId,
      type: "home_visit",
      title: "Home Visit Scheduled",
      body: `Dr. ${req.user.name} scheduled a home visit on ${date} at ${time}. Accept or decline in My Schedule.`,
      refId: visit._id.toString(),
      refModel: "HomeVisit",
    });

    // Notify admin
    await Notification.create({
      toId: "admin", userId: null,
      type: "home_visit",
      title: "Doctor Scheduled Home Visit",
      body: `${req.user.name} -> ${patient?.name} on ${date}.`,
      refId: visit._id.toString(),
      refModel: "HomeVisit",
    });

    return res.status(201).json({
      success: true,
      homeVisit: {
        ...visit.toObject(),
        id: visit._id,
        patientName: patient?.name || "",
        date: new Date(visit.date).toISOString().split("T")[0],
      },
    });
  } catch (err) {
    console.error("createDoctorHomeVisit:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateDoctorHomeVisit = async (req, res) => {
  try {
    const doctor = await getMyDoctor(req.user._id);
    const { status } = req.body;

    const allowed = ["accepted", "declined", "completed", "cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const visit = await HomeVisit.findOneAndUpdate(
      { _id: req.params.id, doctorId: doctor._id },
      { status },
      { new: true }
    ).populate("patientId", "name");

    if (!visit) {
      return res.status(404).json({ success: false, message: "Home visit not found" });
    }

    // Notify patient on status change
    await Notification.create({
      toId: visit.patientId._id.toString(),
      userId: visit.patientId._id,
      type: "home_visit",
      title: "Visit Status Update",
      body: status === "accepted"
        ? `Dr. ${req.user.name} accepted your home visit request! Live tracking is now active.`
        : `Your home visit status has been updated to: ${status}.`,
      refId: visit._id.toString(),
      refModel: "HomeVisit",
    });

    return res.json({
      success: true,
      homeVisit: {
        ...visit.toObject(),
        id: visit._id,
        patientName: visit.patientId?.name || "",
        date: new Date(visit.date).toISOString().split("T")[0],
      },
    });
  } catch (err) {
    console.error("updateDoctorHomeVisit:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════════
   GET /api/doctor/records/:patientId
   POST /api/doctor/records
   Replaces: recordDB in DoctorPanel
══════════════════════════════════════════════════════════════ */
const MedicalRecord = require("../models/MedicalRecord");

const getPatientRecords = async (req, res) => {
  try {
    const doctor = await getMyDoctor(req.user._id);
    const { patientId } = req.params;

    // Verify this patient has appointments with the doctor
    const hasAppt = await Appointment.exists({ doctorId: doctor._id, patientId });
    if (!hasAppt) {
      return res.status(403).json({ success: false, message: "No access to this patient's records" });
    }

    const records = await MedicalRecord.find({ patientId, doctorId: doctor._id })
      .sort({ date: -1 })
      .lean();

    const shaped = records.map(r => ({
      ...r,
      id: r._id,
      date: new Date(r.date).toISOString().split("T")[0],
    }));

    return res.json({ success: true, records: shaped });
  } catch (err) {
    console.error("getPatientRecords:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const createMedicalRecord = async (req, res) => {
  try {
    const doctor = await getMyDoctor(req.user._id);
    const { patientId, title, type, description, vitals, symptoms, treatmentPlan, attachment } = req.body;

    if (!patientId || !title) {
      return res.status(400).json({ success: false, message: "patientId and title required" });
    }

    const patient = await User.findById(patientId).select("name");

    const record = await MedicalRecord.create({
      patientId,
      doctorId: doctor._id,
      title,
      type: type || "procedure",
      description: description || "",
      vitals: vitals || {},
      symptoms: symptoms || "",
      treatmentPlan: treatmentPlan || "",
      attachment: attachment || "",
    });

    // Notify patient
    await Notification.create({
      toId: patientId.toString(),
      userId: patientId,
      type: "record",
      title: "New Medical Record",
      body: `Dr. ${req.user.name} added: ${title}. View it in your Medical Records tab.`,
      refId: record._id.toString(),
      refModel: "MedicalRecord",
    });

    // Notify admin
    await Notification.create({
      toId: "admin", userId: null,
      type: "record",
      title: "Medical Record Added",
      body: `${req.user.name} added a record for ${patient?.name}.`,
      refId: record._id.toString(),
      refModel: "MedicalRecord",
    });

    return res.status(201).json({
      success: true,
      record: {
        ...record.toObject(),
        id: record._id,
        date: new Date(record.date).toISOString().split("T")[0],
        patientName: patient?.name || "",
        doctorName: req.user.name,
      },
    });
  } catch (err) {
    console.error("createMedicalRecord:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateMedicalRecord = async (req, res) => {
  try {
    const doctor = await getMyDoctor(req.user._id);
    const { id } = req.params;
    const { title, type, description, vitals, symptoms, treatmentPlan, attachment } = req.body;
    
    const record = await MedicalRecord.findOneAndUpdate(
      { _id: id, doctorId: doctor._id },
      { title, type, description, vitals, symptoms, treatmentPlan, attachment },
      { new: true }
    );
    
    if (!record) return res.status(404).json({ success: false, message: "Record not found" });
    return res.json({ success: true, record });
  } catch (err) {
    console.error("updateMedicalRecord:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteMedicalRecord = async (req, res) => {
  try {
    const doctor = await getMyDoctor(req.user._id);
    const { id } = req.params;
    
    const deleted = await MedicalRecord.findOneAndDelete({ _id: id, doctorId: doctor._id });
    if (!deleted) return res.status(404).json({ success: false, message: "Record not found" });
    
    return res.json({ success: true, message: "Record deleted" });
  } catch (err) {
    console.error("deleteMedicalRecord:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


const getSOSLogs = async (req, res) => {
  try {
    const PostOpLog = require("../models/PostOpLog");
    // Find logs where SOS was triggered
    const logs = await PostOpLog.find({ sosTriggered: true }).populate("patientId", "name email avatar").sort({ createdAt: -1 });
    res.status(200).json({ success: true, sosLogs: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const resolveSOSLog = async (req, res) => {
  try {
    const PostOpLog = require("../models/PostOpLog");
    const log = await PostOpLog.findByIdAndUpdate(req.params.id, { sosTriggered: false }, { new: true });
    res.status(200).json({ success: true, log });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
module.exports = {
  getSOSLogs,
  resolveSOSLog,
  createPayment, updatePayment, deletePayment,
  deleteNotification, clearNotifications,
  getDoctorOverview,
  getDoctorAppointments, updateDoctorAppointment,
  getDoctorPatients,
  getDoctorPrescriptions, createPrescription, updatePrescription, deletePrescription,
  getDoctorSchedule, updateDoctorSchedule,
  getDoctorNotifications,
  getDoctorThread, doctorSendMessage,
  getDoctorProfile, updateDoctorProfile,
  getDoctorRevenue,
  getDoctorPayments,
  getDoctorConsultations, createDoctorConsultation, updateDoctorConsultation,
  getDoctorHomeVisits, createDoctorHomeVisit, updateDoctorHomeVisit,
  getPatientRecords, createMedicalRecord, updateMedicalRecord, deleteMedicalRecord,
};
