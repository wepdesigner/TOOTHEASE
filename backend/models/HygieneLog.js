const mongoose = require('mongoose');

const HygieneLogSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dateString: {
    type: String, // format: YYYY-MM-DD
    required: true
  },
  brushed: {
    type: Boolean,
    default: false
  },
  flossed: {
    type: Boolean,
    default: false
  },
  mouthwash: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Ensure one log per day per patient
HygieneLogSchema.index({ patientId: 1, dateString: 1 }, { unique: true });

module.exports = mongoose.model('HygieneLog', HygieneLogSchema);
