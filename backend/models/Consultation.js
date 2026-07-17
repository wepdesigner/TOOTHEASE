const mongoose = require("mongoose");

const ConsultationSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["video", "audio"], default: "video" },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    notes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "accepted", "scheduled", "completed", "declined", "cancelled"],
      default: "pending",
    },
    doctorInitiated: { type: Boolean, default: false },
    patientAlerted: { type: Boolean, default: false },
    doctorAlerted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Consultation", ConsultationSchema);
