const express = require("express");
const { getThread, sendMessage } = require("../controllers/message.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/:contactId", protect, getThread);
router.post("/", protect, sendMessage);

module.exports = router;
