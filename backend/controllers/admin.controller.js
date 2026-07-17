const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const Payment = require("../models/Payment");

exports.createAdminDoctor = async (req, res) => {
  try {
    const { name, email, password, phone = "", specialty, consultFee = 15000, experience = "", location = "", bio = "" } = req.body;
    if (!name || !email || !password || !specialty) return res.status(400).json({ success:false, message:"Name, email, password and specialty are required" });
    if (await User.findOne({ email: email.toLowerCase().trim() })) return res.status(409).json({ success:false, message:"Email already in use" });
    const user = await User.create({ name, email:email.toLowerCase().trim(), password, phone, role:"DOCTOR", status:"ACTIVE" });
    const doctor = await Doctor.create({ userId:user._id, specialty, consultFee:Number(consultFee), experience, location, bio, status:"ACTIVE" });
    res.status(201).json({ success:true, doctor: await doctor.populate("userId", "name email phone avatar") });
  } catch (err) { console.error("createAdminDoctor:", err); res.status(500).json({ success:false, message:"Unable to create doctor" }); }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const status = String(req.body.status || "").toUpperCase();
    if (!["ACTIVE", "INACTIVE"].includes(status)) return res.status(400).json({ success:false, message:"Invalid status" });
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new:true }).select("-password");
    if (!user) return res.status(404).json({ success:false, message:"User not found" });
    res.json({ success:true, user });
  } catch (err) { res.status(500).json({ success:false, message:"Unable to update user" }); }
};

exports.updateAdminAppointmentStatus = async (req, res) => {
  try {
    const status = String(req.body.status || "").toUpperCase();
    if (!["PENDING","CONFIRMED","COMPLETED","CANCELLED"].includes(status)) return res.status(400).json({ success:false, message:"Invalid status" });
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, { status }, { new:true });
    if (!appointment) return res.status(404).json({ success:false, message:"Appointment not found" });
    res.json({ success:true, appointment });
  } catch (err) { res.status(500).json({ success:false, message:"Unable to update appointment" }); }
};

exports.completePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success:false, message:"Payment not found" });
    const pct = Number(payment.forfaitPct ?? 10);
    payment.status = "COMPLETED"; payment.adminFee = Math.round(payment.amount * pct / 100); payment.doctorEarnings = payment.amount - payment.adminFee;
    await payment.save(); res.json({ success:true, payment });
  } catch (err) { res.status(500).json({ success:false, message:"Unable to confirm payment" }); }
};

/* ══════════════════════════════════════════════════════════════
   GET /api/admin/overview
   Returns stats for the admin dashboard
══════════════════════════════════════════════════════════════ */
exports.getAdminOverview = async (req, res) => {
  try {
    const totalPatients = await User.countDocuments({ role: "PATIENT" });
    const totalDoctors = await Doctor.countDocuments();
    const activeDoctors = await Doctor.countDocuments({ status: "ACTIVE" });
    const pendingAppointments = await Appointment.countDocuments({ status: "PENDING" });
    const totalAppointments = await Appointment.countDocuments();
    
    const payments = await Payment.find({ status: "COMPLETED" });
    const totalRevenue = payments.reduce((sum, p) => sum + (p.adminFee || (p.amount * 0.1) || 0), 0);

    // Recent activity (5 latest appointments for "Approval requests" block)
    const recentActivity = await Appointment.find({ status: "PENDING" })
      .populate("patientId", "name avatar")
      .populate({ path: "doctorId", populate: { path: "userId", select: "name" } })
      .sort({ createdAt: -1 })
      .limit(5);

    // Today's appointments
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todaysAppointments = await Appointment.find({ date: { $gte: startOfDay, $lte: endOfDay } })
      .populate("patientId", "name")
      .populate({ path: "doctorId", populate: { path: "userId", select: "name" } })
      .sort({ time: 1 })
      .limit(5);

    // Monthly Appointments aggregation (Last 6 months)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const allAppts = await Appointment.find({ createdAt: { $exists: true } }).select("createdAt status");
    const monthlyAppointmentsMap = {};
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mName = months[d.getMonth()];
      monthlyAppointmentsMap[mName] = { name: mName, Booked: 0, Canceled: 0 };
    }
    
    allAppts.forEach(a => {
      const date = new Date(a.createdAt);
      if (date >= new Date(new Date().setMonth(new Date().getMonth() - 5))) {
        const mName = months[date.getMonth()];
        if (monthlyAppointmentsMap[mName]) {
          if (a.status === "CANCELLED") monthlyAppointmentsMap[mName].Canceled += 1;
          else monthlyAppointmentsMap[mName].Booked += 1;
        }
      }
    });
    const monthlyAppointments = Object.values(monthlyAppointmentsMap);

    // Top Treatments Pie Chart
    const treatments = await Appointment.aggregate([
      { $group: { _id: "$healthType", value: { $sum: 1 } } },
      { $sort: { value: -1 } },
      { $limit: 4 }
    ]);
    const treatmentStats = treatments.map(t => ({ name: t._id || "Consultation", value: t.value }));
    if (treatmentStats.length === 0) {
      treatmentStats.push({ name: "Consultation", value: 10 }, { name: "Scaling", value: 5 }, { name: "Root Canal", value: 3 });
    }

    // Success Rates Line Chart (mocked up/down trend over 6 months)
    const successRates = Object.values(monthlyAppointmentsMap).map(m => {
      const total = m.Booked + m.Canceled;
      const rate = total === 0 ? 80 : Math.round((m.Booked / total) * 100);
      return { name: m.name, rate };
    });

    res.status(200).json({
      success: true,
      stats: {
        totalPatients,
        totalDoctors,
        activeDoctors,
        pendingAppointments,
        totalAppointments,
        totalRevenue
      },
      recentActivity,
      todaysAppointments,
      monthlyAppointments,
      treatmentStats,
      successRates
    });
  } catch (err) {
    console.error("getAdminOverview error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════════
   GET /api/admin/users
   Returns all users
══════════════════════════════════════════════════════════════ */
exports.getAdminUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json({ success: true, users });
  } catch (err) {
    console.error("getAdminUsers error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════════
   GET /api/admin/doctors
   Returns all doctors with their user info
══════════════════════════════════════════════════════════════ */
exports.getAdminDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .populate("userId", "name email phone avatar")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, doctors });
  } catch (err) {
    console.error("getAdminDoctors error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════════
   PATCH /api/admin/doctors/:id/status
   Updates doctor status (e.g. ACTIVE, INACTIVE, PENDING)
══════════════════════════════════════════════════════════════ */
exports.updateDoctorStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("userId", "name email");

    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    res.status(200).json({ success: true, doctor });
  } catch (err) {
    console.error("updateDoctorStatus error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════════
   GET /api/admin/appointments
   Returns all appointments
══════════════════════════════════════════════════════════════ */
exports.getAdminAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("patientId", "name email phone")
      .populate({ path: "doctorId", populate: { path: "userId", select: "name specialty" } })
      .sort({ date: -1, time: -1 });
    res.status(200).json({ success: true, appointments });
  } catch (err) {
    console.error("getAdminAppointments error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════════
   GET /api/admin/payments
   Returns all payments
══════════════════════════════════════════════════════════════ */
exports.getAdminPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("patientId", "name")
      .populate({ path: "doctorId", populate: { path: "userId", select: "name" } })
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, payments });
  } catch (err) {
    console.error("getAdminPayments error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// --- SAAS MRR & MEMBERSHIP STATS ---
exports.getMembershipStats = async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['PATIENT', 'patient'] } }).select('-password');
    
    let totalSubscribers = 0;
    let totalMRR = 0;
    let counts = { Basic: 0, 'Silver Care': 0, 'Gold Premium': 0 };
    
    // Calculate MRR
    const prices = { 'Basic': 0, 'Silver Care': 5000, 'Gold Premium': 12000 };
    
    const recentUpgrades = [];
    
    users.forEach(u => {
      const plan = u.membershipPlan || 'Basic';
      counts[plan] = (counts[plan] || 0) + 1;
      
      if (plan !== 'Basic') {
        totalSubscribers++;
        totalMRR += prices[plan] || 0;
        
        // Collect active subscribers for recent list
        recentUpgrades.push({
          id: u._id,
          name: u.name,
          email: u.email,
          plan: plan,
          expiry: u.membershipExpiry,
          updatedAt: u.updatedAt
        });
      }
    });
    
    // Sort recent upgrades by updatedAt desc
    recentUpgrades.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.json({
      success: true,
      stats: {
        totalSubscribers,
        totalMRR,
        counts
      },
      recent: recentUpgrades.slice(0, 50)
    });
  } catch (err) {
    console.error("getMembershipStats Error:", err);
    res.status(500).json({ success: false, message: "Unable to fetch membership stats" });
  }
};
