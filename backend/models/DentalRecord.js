const mongoose = require("mongoose");

const DentalRecordSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    toothId: { type: String, required: true }, // e.g. "11", "48"
    condition: { 
      type: String, 
      enum: ["Healthy", "Cavity", "Crown", "Extracted", "Implant", "Filling", "Root Canal", "Veneer", "Bridge", "Watch"], 
      required: true 
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DentalRecord", DentalRecordSchema);
