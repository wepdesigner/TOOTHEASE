const mongoose = require("mongoose");

const HomeVisitSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    address: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    service: { type: String, default: "" },
    notes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "scheduled", "accepted", "declined", "completed", "cancelled"],
      default: "pending",
    },
    createdByDoctor: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HomeVisit", HomeVisitSchema);
