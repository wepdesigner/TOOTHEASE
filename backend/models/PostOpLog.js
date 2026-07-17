const mongoose = require("mongoose");

const PostOpLogSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional if we just want it tied to patient generally
    },
    procedureName: {
      type: String,
      default: "General Extraction",
    },
    dayNumber: {
      type: Number,
      required: true,
    },
    painLevel: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    notes: {
      type: String,
      default: "",
    },
    photoUrl: {
      type: String,
      default: "",
    },
    sosTriggered: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PostOpLog", PostOpLogSchema);
