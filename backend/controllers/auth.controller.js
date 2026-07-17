// src/controllers/auth.controller.js
// Handles: POST /api/auth/login
//          POST /api/auth/register
//          GET  /api/auth/me
//          POST /api/auth/logout
//          GET  /api/auth/validate-session

const jwt  = require("jsonwebtoken");
const User   = require("../models/User");
const Doctor = require("../models/Doctor");

/* ── Helper: sign a JWT ──────────────────────────────────────────────────── */
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

/* ── Helper: build the session object Auth.jsx expects ──────────────────── */
const buildSession = (user, doctorProfile = null) => ({
  id:     user._id.toString(),
  name:   user.name,
  email:  user.email,
  phone:  user.phone  || "",
  role:   user.role.toLowerCase(),   // "admin" | "doctor" | "patient"
  status: user.status,
  avatar: user.avatar || null,

  // Patient extras
  title:             user.title             || "",
  dob:               user.dob               || "",
  country:           user.country           || "Cameroon",
  address:           user.address           || "",
  bloodType:         user.bloodType         || "",
  allergies:         user.allergies         || "",
  emergency:         user.emergency         || "",
  membership:        user.membership        || false,
  forfait:           user.plan?.name        || "Basic",
  preferredDoctorId: user.preferredDoctor?.toString() || null,

  // Doctor extras (only when role === doctor)
  ...(doctorProfile && {
    doctorProfileId: doctorProfile._id.toString(),
    specialty:       doctorProfile.specialty,
    consultFee:      doctorProfile.consultFee,
    commissionPct:   doctorProfile.commissionPct,
    color:           doctorProfile.color || "#1e88e5",
  }),
});

/* ══════════════════════════════════════════════════════════════
   POST /api/auth/login
   Body: { email, password }
   Matches: adm_admins + adm_doctors + te_patients (all in User collection)
══════════════════════════════════════════════════════════════ */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user — include password for comparison
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      status: { $ne: "DELETED" },
    })
      .select("+password")
      .populate("plan", "name price commissionPct");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check account active
    if (user.status === "INACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Contact admin.",
      });
    }

    // Load doctor profile if role is DOCTOR
    let doctorProfile = null;
    if (user.role === "DOCTOR") {
      doctorProfile = await Doctor.findOne({ userId: user._id });
    }

    const token   = signToken(user._id);
    const session = buildSession(user, doctorProfile);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: session,
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════════
   POST /api/auth/register
   Body: { name, email, password, phone, title, dob, country,
           address, bloodType, allergies, emergency, preferredDoctorId }
   Creates a PATIENT account only (doctors added by admin)
══════════════════════════════════════════════════════════════ */
const register = async (req, res) => {
  try {
    const {
      name, email, password, phone,
      title, dob, country, address,
      bloodType, allergies, emergency,
      preferredDoctorId,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    // Check duplicate email
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Create patient
    const user = await User.create({
      name:              name.trim(),
      email:             email.toLowerCase().trim(),
      password,
      phone:             phone             || "",
      role:              "PATIENT",
      status:            "ACTIVE",
      title:             title             || "",
      dob:               dob               || undefined,
      country:           country           || "Cameroon",
      address:           address           || "",
      bloodType:         bloodType         || "",
      allergies:         allergies         || "",
      emergency:         emergency         || "",
      membership:        false,
      preferredDoctor:   preferredDoctorId || undefined,
    });

    const token   = signToken(user._id);
    const session = buildSession(user);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: session,
    });
  } catch (err) {
    console.error("register error:", err);
    // Mongoose validation error
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════════
   GET /api/auth/me  (protected)
   Returns fresh user data — used by Auth.jsx to restore session
   and reflect any profile updates
══════════════════════════════════════════════════════════════ */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("plan", "name price commissionPct");

    let doctorProfile = null;
    if (user.role === "DOCTOR") {
      doctorProfile = await Doctor.findOne({ userId: user._id });
    }

    return res.status(200).json({
      success: true,
      user: buildSession(user, doctorProfile),
    });
  } catch (err) {
    console.error("getMe error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════════
   GET /api/auth/validate-session  (protected)
   Called on app mount to check if the stored JWT is still valid.
   Returns 200 with fresh user data, or 401 if expired/invalid.
══════════════════════════════════════════════════════════════ */
const validateSession = async (req, res) => {
  // req.user is already populated by protect middleware
  return getMe(req, res);
};

/* ══════════════════════════════════════════════════════════════
   POST /api/auth/logout  (protected — optional)
   JWT is stateless so logout is handled client-side (delete token).
   This endpoint exists so the frontend can call it for audit logging.
══════════════════════════════════════════════════════════════ */
const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

module.exports = { login, register, getMe, validateSession, logout };
