const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    healthType: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    notes: { type: String, default: "" },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"], default: "PENDING" },
    isHomeVisit: { type: Boolean, default: false },
    isVideoConsultation: { type: Boolean, default: false },
    visitAddress: { type: String, default: "" },
    roomId: { type: String, default: "" },
    trackingId: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", AppointmentSchema);
