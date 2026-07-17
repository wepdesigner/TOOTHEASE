const mongoose = require("mongoose");

const MedicalRecordSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ["procedure", "imaging", "lab", "prescription", "note", "diagnosis"],
      default: "procedure",
    },
    description: { type: String, default: "" },
    
    // Clinical Expansions
    vitals: {
      bp: { type: String, default: "" },
      hr: { type: String, default: "" },
      temp: { type: String, default: "" },
      weight: { type: String, default: "" },
    },
    symptoms: { type: String, default: "" },
    treatmentPlan: { type: String, default: "" },
    attachment: { type: String, default: "" }, // Base64 or URL

    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MedicalRecord", MedicalRecordSchema);
