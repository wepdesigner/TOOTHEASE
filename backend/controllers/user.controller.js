// src/controllers/user.controller.js
const User         = require("../models/User");
const Notification = require("../models/Notification");
const Consultation = require("../models/Consultation");
const Appointment  = require("../models/Appointment");
const Prescription = require("../models/Prescription");
const Payment      = require("../models/Payment");
const DentalRecord = require("../models/DentalRecord");
const HomeVisit    = require("../models/HomeVisit");
const MedicalRecord= require("../models/MedicalRecord");
const bcrypt       = require("bcryptjs");











/* ══════════════════════════════════════════════════════════════ */
const updateMe = async (req, res) => {
  try {
    const allowed = ["name", "phone", "dob", "country", "address",
                     "bloodType", "allergies", "emergency", "email"];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    // Prevent email clash
    if (updates.email) {
      const clash = await User.findOne({
        email: updates.email.toLowerCase(),
        _id: { $ne: req.user._id },
      });
      if (clash) {
        return res.status(409).json({ success: false, message: "Email already in use" });
      }
      updates.email = updates.email.toLowerCase().trim();
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true, runValidators: true,
    }).select("-password").populate("plan", "name price");

    // Notify admin of profile update
    await Notification.create({
      toId:  "admin",
      type:  "patient",
      title: "Patient Profile Updated",
      body:  `${user.name} updated their profile.`,
    });

    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error("updateMe:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ success: false, message: Object.values(err.errors).map(e => e.message).join(", ") });
    }
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════════
   PATCH /api/users/me/password
   Replaces: admPatientDB.update(id, { password }) in DashProfile
══════════════════════════════════════════════════════════════ */
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Both old and new password required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id).select("+password");
    const match = await user.matchPassword(oldPassword);
    if (!match) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("changePassword:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════════
   DELETE /api/users/me
   Soft delete — sets status to DELETED.
   Replaces: admPatientDB.update(id, { status: "deleted" })
══════════════════════════════════════════════════════════════ */
const deleteMe = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { status: "DELETED" },
      { new: true }
    );

    await Notification.create({
      toId:  "admin",
      type:  "patient",
      title: "Patient Account Deleted",
      body:  `${user.name} deleted their account.`,
    });

    return res.status(200).json({ success: true, message: "Account deleted" });
  } catch (err) {
    console.error("deleteMe:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};




const getMyPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.user._id })
      .populate({ path: "doctorId", populate: { path: "userId", select: "name" } })
      .sort({ createdAt: -1 })
      .lean();

    const shaped = prescriptions.map(p => ({
      ...p,
      id: p._id,
      patientName: req.user.name,
      doctorName: p.doctorId?.userId?.name || "Doctor",
    }));

    return res.status(200).json({ success: true, prescriptions: shaped });
  } catch (err) {
    console.error("getMyPrescriptions:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getMyRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find({ patientId: req.user._id })
      .populate({ path: "doctorId", populate: { path: "userId", select: "name" } })
      .sort({ date: -1 })
      .lean();

    const shaped = records.map(r => ({
      ...r,
      id: r._id,
      date: new Date(r.date).toISOString().split("T")[0],
      doctorName: r.doctorId?.userId?.name || "Doctor",
    }));

    return res.status(200).json({ success: true, records: shaped });
  } catch (err) {
    console.error("getMyRecords:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};




const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ patientId: req.user._id })
      .populate("doctorId", "name specialty")
      .sort({ createdAt: -1 })
      .lean();
    
    const shaped = payments.map(p => ({
      id: p._id,
      service: p.service,
      amount: p.amount,
      status: p.status,
      method: p.method,
      doctorName: p.doctorId ? p.doctorId.name : "N/A",
      date: p.createdAt ? new Date(p.createdAt).toISOString().split("T")[0] : "",
    }));

    res.json({ success: true, payments: shaped });
  } catch (err) {
    console.error("getMyPayments:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ toId: req.user._id.toString() })
      .sort({ createdAt: -1 })
      .lean();
    
    await Notification.updateMany({ toId: req.user._id.toString(), read: false }, { read: true });

    res.json({ success: true, notifications });
  } catch (err) {
    console.error("getMyNotifications:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteMyNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Notification.findOneAndDelete({ _id: id, toId: req.user._id.toString() });
    if (!deleted) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error("deleteMyNotification error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const clearMyNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ toId: req.user._id.toString() });
    res.json({ success: true, message: "Cleared" });
  } catch (err) {
    console.error("clearMyNotifications error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


/* ── GET /api/users/me/consultations ── */
const getMyConsultations = async (req, res) => {
  try {
    const consultations = await Consultation.find({ patientId: req.user._id })
      .populate({ path: "doctorId", populate: { path: "userId", select: "name" } })
      .sort({ date: -1 })
      .lean();
    res.status(200).json({ success: true, consultations });
  } catch (err) {
    console.error("GET CONSULTATIONS ERROR:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

/* ── DELETE /api/users/me/consultations/:id ── */
const deleteMyConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findOneAndDelete({ _id: req.params.id, patientId: req.user._id });
    if (!consultation) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ── GET /api/users/me/home-visits ── */
const getMyHomeVisits = async (req, res) => {
  try {
    const homeVisits = await HomeVisit.find({ patientId: req.user._id })
      .populate({ path: "doctorId", populate: { path: "userId", select: "name" } })
      .sort({ date: -1 })
      .lean();
    res.status(200).json({ success: true, homeVisits });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ── DELETE /api/users/me/prescriptions/:id ── */
const deleteMyPrescription = async (req, res) => {
  try {

    const p = await Prescription.findOneAndDelete({ _id: req.params.id, patientId: req.user._id });
    if (!p) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};


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





const simulateAiScan = async (req, res) => {
  try {
    // Simulate AI processing delay (2 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Scenarios for the AI to return
    const scenarios = [
      {
        diagnosis: "Mild Tartar Buildup & Gingivitis",
        confidence: 94,
        severity: "Low",
        recommendation: "Routine Cleaning",
        details: "Detected plaque accumulation along the gumline of the lower incisors."
      },
      {
        diagnosis: "Potential Cavity (Caries)",
        confidence: 87,
        severity: "Medium",
        recommendation: "Consultation",
        details: "Dark spot detected on the occlusal surface, likely requiring a filling."
      },
      {
        diagnosis: "Healthy Teeth & Gums",
        confidence: 98,
        severity: "None",
        recommendation: "None",
        details: "No visible signs of decay or inflammation. Keep up the good work!"
      },
      {
        diagnosis: "Severe Gum Inflammation",
        confidence: 91,
        severity: "High",
        recommendation: "Consultation",
        details: "Significant redness and swelling detected. Immediate periodontal evaluation recommended."
      }
    ];

    // Pick a random scenario
    const result = scenarios[Math.floor(Math.random() * scenarios.length)];
    
    res.status(200).json({ success: true, aiResult: result });
  } catch (err) {
    res.status(500).json({ success: false, message: "AI Engine error" });
  }
};

const getMyDentalRecords = async (req, res) => {
  try {

    const records = await DentalRecord.find({ patientId: req.user._id }).populate("doctorId", "userId").sort({ createdAt: -1 });
    res.status(200).json({ success: true, dentalRecords: records });
  } catch (err) { res.status(500).json({ success: false, message: "Server error" }); }
};

const deleteMyAppointment = async (req, res) => {
  try {

    const appt = await Appointment.findOneAndDelete({ _id: req.params.id, patientId: req.user._id });
    if (!appt) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, message: "Appointment deleted" });
  } catch (err) { res.status(500).json({ success: false, message: "Server error" }); }
};

const updateMyAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const appt = await Appointment.findOneAndUpdate(
      { _id: req.params.id, patientId: req.user._id },
      { status },
      { new: true }
    );
    if (!appt) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, appointment: appt });
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


const getMyPostOpLogs = async (req, res) => {
  try {
    const PostOpLog = require("../models/PostOpLog");
    const logs = await PostOpLog.find({ patientId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, postOpLogs: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const submitPostOpLog = async (req, res) => {
  try {
    const PostOpLog = require("../models/PostOpLog");
    const { procedureName, dayNumber, painLevel, notes, photoUrl, doctorId } = req.body;
    
    // Automatically trigger SOS if pain is high
    const sosTriggered = parseInt(painLevel) >= 8;

    const newLog = await PostOpLog.create({
      patientId: req.user._id,
      doctorId,
      procedureName,
      dayNumber,
      painLevel,
      notes,
      photoUrl,
      sosTriggered
    });

    res.status(201).json({ success: true, postOpLog: newLog, sosTriggered });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getMyPostOpLogs,
  submitPostOpLog,
  updateMyConsultationStatus,
  updateMyHomeVisitStatus,
  updateMyAppointmentStatus,
  deleteMyAppointment,
  getMyDentalRecords,
  simulateAiScan,
  getMyConsultations,
  deleteMyConsultation,
  getMyHomeVisits,
  deleteMyPrescription,

  getMyPayments, getMyNotifications, deleteMyNotification, clearMyNotifications, updateMe, changePassword, deleteMe, getMyPrescriptions, getMyRecords };

// ----------------------------------------------------
// HYGIENE TRACKER
// ----------------------------------------------------

module.exports.logHygieneActivity = async (req, res) => {
  try {
    const { brushed, flossed, mouthwash, dateString } = req.body;
    const patientId = req.user.id;
    const today = dateString || new Date().toISOString().split('T')[0];

    // Find or create today's log
    let log = await HygieneLog.findOne({ patientId, dateString: today });
    if (!log) {
      log = new HygieneLog({ patientId, dateString: today });
    }

    // Check if points were already awarded for today
    const alreadyLoggedToday = log.brushed || log.flossed || log.mouthwash;

    // Update log
    log.brushed = log.brushed || brushed;
    log.flossed = log.flossed || flossed;
    log.mouthwash = log.mouthwash || mouthwash;
    await log.save();

    // Give points (only if they haven't been awarded today)
    // For example: +10 points for each activity per day
    let pointsEarned = 0;
    if (brushed && !alreadyLoggedToday) pointsEarned += 10;
    if (flossed && !alreadyLoggedToday) pointsEarned += 10;
    if (mouthwash && !alreadyLoggedToday) pointsEarned += 5;

    // Update user streak and points
    const user = await User.findById(patientId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    // Check if yesterday was logged to maintain streak
    if (!alreadyLoggedToday) {
      user.smilePoints = (user.smilePoints || 0) + pointsEarned;
      
      const yesterday = new Date(new Date(today).setDate(new Date(today).getDate() - 1)).toISOString().split('T')[0];
      const yesterdayLog = await HygieneLog.findOne({ patientId, dateString: yesterday });
      
      if (yesterdayLog && (yesterdayLog.brushed || yesterdayLog.flossed || yesterdayLog.mouthwash)) {
        user.currentStreak = (user.currentStreak || 0) + 1;
      } else {
        user.currentStreak = 1; // reset streak if yesterday was missed
      }
      user.lastHygieneLog = new Date();
      await user.save();
    }

    res.status(200).json({ 
      success: true, 
      log, 
      streak: user.currentStreak, 
      points: user.smilePoints,
      pointsEarned
    });
  } catch (error) {
    console.error('Hygiene Log Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports.getHygieneStats = async (req, res) => {
  try {
    const patientId = req.user.id;
    const user = await User.findById(patientId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Get this month's logs
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const logs = await HygieneLog.find({ 
      patientId, 
      createdAt: { $gte: startOfMonth }
    }).sort({ dateString: 1 });

    res.status(200).json({
      success: true,
      streak: user.currentStreak || 0,
      points: user.smilePoints || 0,
      logs
    });
  } catch (error) {
    console.error('Get Hygiene Stats Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ----------------------------------------------------
// MEMBERSHIP SUBSCRIPTION
// ----------------------------------------------------

module.exports.upgradeMembership = async (req, res) => {
  try {
    const { plan, duration, price } = req.body;
    const patientId = req.user.id;
    const user = await User.findById(patientId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Mock payment successful logic
    
    // Set expiry
    const expiry = new Date();
    if (duration === 'annual') {
      expiry.setFullYear(expiry.getFullYear() + 1);
    } else {
      expiry.setMonth(expiry.getMonth() + 1);
    }

    user.membershipPlan = plan;
    user.membershipStatus = 'active';
    user.membershipExpiry = expiry;
    
    await user.save();

    res.status(200).json({
      success: true,
      message: `Successfully upgraded to ${plan}`,
      membershipPlan: user.membershipPlan,
      membershipStatus: user.membershipStatus,
      membershipExpiry: user.membershipExpiry
    });
  } catch (error) {
    console.error('Membership Upgrade Error:', error);
    res.status(500).json({ success: false, message: 'Server error during upgrade' });
  }
};
