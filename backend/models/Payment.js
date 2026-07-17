const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    service: { type: String, required: true },
    amount: { type: Number, required: true },
    method: { type: String, default: "Cash" },
    status: { type: String, enum: ["PENDING", "COMPLETED", "FAILED"], default: "PENDING" },
    forfaitPct: { type: Number, default: 10 },
    adminFee: { type: Number, default: 0 },
    doctorEarnings: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", PaymentSchema);
