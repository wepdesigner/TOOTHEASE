const mongoose = require("mongoose");

const PrescriptionSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    
    // Expanded clinical fields
    diagnosis: { type: String, default: "" },
    medicines: [
      {
        name: { type: String, required: true },
        dosage: { type: String, default: "" },
        frequency: { type: String, default: "" },
        duration: { type: String, default: "" }
      }
    ],
    notes: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prescription", PrescriptionSchema);
