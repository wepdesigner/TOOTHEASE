const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../backend/controllers/admin.controller.js');
let content = fs.readFileSync(targetFile, 'utf8');

const getOverviewRegex = /exports\.getAdminOverview = async \(req, res\) => \{([\s\S]*?)catch \(err\) \{/m;

const newGetOverview = `exports.getAdminOverview = async (req, res) => {
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
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const todaysAppointments = await Appointment.find({ date: { $regex: \`^\${todayStr}\` } })
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
  } catch (err) {`;

content = content.replace(getOverviewRegex, newGetOverview);
fs.writeFileSync(targetFile, content);
console.log("Updated admin.controller.js with dynamic data aggregations");
