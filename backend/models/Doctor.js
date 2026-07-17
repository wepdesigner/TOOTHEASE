const mongoose = require("mongoose");

const DoctorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    specialty: { type: String, required: true },
    consultFee: { type: Number, default: 15000 },
    commissionPct: { type: Number, default: 12 },
    color: { type: String, default: "#1e88e5" },
    experience: { type: String, default: "" },
    location: { type: String, default: "" },
    bio: { type: String, default: "" },
    rating: { type: Number, default: 5.0 },
    revenue: { type: Number, default: 0 },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", DoctorSchema);
