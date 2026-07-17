// src/controllers/message.controller.js
// Replaces: LS.get/set(`te_thread_${patient.id}_${selId}`)
// Queries: messages where (sender=me, receiver=contact) OR (sender=contact, receiver=me)

const Message      = require("../models/Message");
const Notification = require("../models/Notification");
const User         = require("../models/User");

/* ══════════════════════════════════════════════════════════════
   GET /api/messages/:contactId
   Returns the full conversation thread between me and :contactId
   contactId can be a userId OR "admin"
══════════════════════════════════════════════════════════════ */
const getThread = async (req, res) => {
  try {
    const myId      = req.user._id.toString();
    const contactId = req.params.contactId;

    const messages = await Message.find({
      $or: [
        { senderId: myId,      receiverId: contactId },
        { senderId: contactId, receiverId: myId      },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("senderId", "name role avatar")
      .lean();

    // Shape to match what DashMessages expects:
    // { id, from: "patient"|"doctor"|"admin", text, ts, read }
    const shaped = messages.map((m) => ({
      id:   m._id,
      from: m.senderId._id.toString() === myId ? "patient" : m.senderId.role.toLowerCase(),
      text: m.text,
      ts:   new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: m.read,
      createdAt: m.createdAt,
    }));

    // Mark received messages as read
    await Message.updateMany(
      { senderId: contactId, receiverId: myId, read: false },
      { read: true, readAt: new Date() }
    );

    return res.status(200).json({ success: true, messages: shaped });
  } catch (err) {
    console.error("getThread:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════════════════
   POST /api/messages
   Body: { receiverId, text }
   Replaces: LS.set(`te_thread_...`) + docNotify()
══════════════════════════════════════════════════════════════ */
const sendMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !text?.trim()) {
      return res.status(400).json({ success: false, message: "receiverId and text are required" });
    }

    const message = await Message.create({
      senderId,
      receiverId,
      text: text.trim(),
    });

    // Notify receiver
    const sender = await User.findById(senderId).select("name");
    await Notification.create({
      toId:     receiverId,
      userId:   receiverId === "admin" ? null : receiverId,
      type:     "message",
      title:    `Message from ${sender.name}`,
      body:     text.trim().slice(0, 80),
      refId:    message._id.toString(),
      refModel: "Message",
    });

    const populated = await Message.findById(message._id)
      .populate("senderId", "name role avatar");

    const shaped = {
      id:   populated._id,
      from: "patient",  // sender is always the logged-in user here
      text: populated.text,
      ts:   new Date(populated.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: false,
      createdAt: populated.createdAt,
    };

    return res.status(201).json({ success: true, message: shaped });
  } catch (err) {
    console.error("sendMessage:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getThread, sendMessage };
