const express = require("express");
const { login, register, getMe, validateSession, logout } = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.get("/me", protect, getMe);
router.get("/validate-session", protect, validateSession);
router.post("/logout", protect, logout);

module.exports = router;
