const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    phone: { type: String, default: "" },
    role: { type: String, enum: ["PATIENT", "DOCTOR", "ADMIN"], default: "PATIENT" },
    status: { type: String, enum: ["ACTIVE", "INACTIVE", "DELETED"], default: "ACTIVE" },
    avatar: { type: String, default: "" },

    // Patient specific fields
    title: { type: String, default: "" },
    dob: { type: Date },
    country: { type: String, default: "Cameroon" },
    address: { type: String, default: "" },
    bloodType: { type: String, default: "" },
    allergies: { type: String, default: "" },
    emergency: { type: String, default: "" },
    membershipPlan: {
    type: String,
    enum: ['Basic', 'Silver Care', 'Gold Premium'],
    default: 'Basic'
  },
  membershipExpiry: {
    type: Date,
    default: null
  },
  membershipStatus: {
    type: String,
    enum: ['active', 'cancelled', 'past_due', 'none'],
    default: 'none'
  },
  smilePoints: {
    type: Number,
    default: 0
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  lastHygieneLog: {
    type: Date,
    default: null
  },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: "Plan" },
    preferredDoctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
