const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    toId: { type: String, required: true }, // Can be "admin", or a User ID
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: { type: String, required: true }, // "appointment", "patient", etc.
    title: { type: String, required: true },
    body: { type: String, required: true },
    refId: { type: String },
    refModel: { type: String }, // "Appointment", etc.
    read: { type: Boolean, default: false },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);
