import express from "express";
import { Chat, Message } from "../models/Chat.js";
import { authMiddleware } from "../middleware/auth.js";
import { io, onlineUsers } from "../server.js";

const router = express.Router();

// ── helpers ──────────────────────────────────────────────────────────────────
const visibleFilter = (userId) => ({
  $or: [
    { senderId: userId,   isDeletedForSender: false },
    { receiverId: userId, isDeletedForReceiver: false }
  ]
});

// ── GET all chats for current user ───────────────────────────────────────────
router.get("/", authMiddleware, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user.id,
      deletedFor: { $ne: req.user.id }   // hide chats deleted by this user
    })
      .populate("participants", "fname lname profileImage")
      .populate("product", "title images")
      .sort({ lastMessageTime: -1 });
    res.json(chats);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ── CREATE or GET existing chat ───────────────────────────────────────────────
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { recipientId, productId } = req.body;
    let chat = await Chat.findOne({
      participants: { $all: [req.user.id, recipientId] },
      product: productId
    }).populate("participants", "fname lname profileImage")
      .populate("product", "title images");

    if (!chat) {
      chat = new Chat({ participants: [req.user.id, recipientId], product: productId });
      await chat.save();
      await chat.populate("participants", "fname lname profileImage");
      await chat.populate("product", "title images");
    }
    res.json(chat);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ── GET messages for a chat ───────────────────────────────────────────────────
router.get("/:chatId/messages", authMiddleware, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    if (!chat.participants.includes(req.user.id))
      return res.status(403).json({ message: "Unauthorized" });

    const messages = await Message.find({
      chat: req.params.chatId,
      ...visibleFilter(req.user.id)
    }).populate("senderId", "fname lname profileImage")
      .sort({ createdAt: 1 });

    // Mark received messages as seen
    const updated = await Message.updateMany(
      { chat: req.params.chatId, receiverId: req.user.id, status: { $ne: "seen" } },
      { status: "seen" }
    );

    if (updated.modifiedCount > 0) {
      io.to(req.params.chatId).emit("messagesSeen", { chatId: req.params.chatId, seenBy: req.user.id });
    }

    res.json(messages);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ── SEND message ──────────────────────────────────────────────────────────────
router.post("/:chatId/messages", authMiddleware, async (req, res) => {
  try {
    const { message, messageType = "text" } = req.body;
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    if (!chat.participants.includes(req.user.id))
      return res.status(403).json({ message: "Unauthorized" });

    const receiverId = chat.participants.find(p => p.toString() !== req.user.id);

    // If receiver is online → delivered, else sent
    const status = onlineUsers.has(receiverId.toString()) ? "delivered" : "sent";

    const msg = new Message({
      chat: req.params.chatId,
      senderId: req.user.id,
      receiverId,
      message,
      messageType,
      status
    });
    await msg.save();
    await msg.populate("senderId", "fname lname profileImage");

    chat.lastMessage = message;
    chat.lastMessageTime = new Date();
    // If receiver had hidden this chat, restore it for them
    chat.deletedFor = chat.deletedFor.filter(id => id.toString() !== receiverId.toString());
    await chat.save();

    io.to(req.params.chatId).emit("newMessage", msg);
    res.status(201).json(msg);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ── EDIT message (sender only) ────────────────────────────────────────────────
router.patch("/messages/:msgId", authMiddleware, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.msgId);
    if (!msg) return res.status(404).json({ message: "Not found" });
    if (msg.senderId.toString() !== req.user.id)
      return res.status(403).json({ message: "Only sender can edit" });

    msg.message = req.body.message;
    msg.isEdited = true;
    await msg.save();
    await msg.populate("senderId", "fname lname profileImage");

    io.to(msg.chat.toString()).emit("messageEdited", msg);
    res.json(msg);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ── DELETE for me / for everyone ──────────────────────────────────────────────
router.delete("/messages/:msgId", authMiddleware, async (req, res) => {
  try {
    const { deleteFor } = req.body; // "me" | "everyone"
    const msg = await Message.findById(req.params.msgId);
    if (!msg) return res.status(404).json({ message: "Not found" });

    const isSender = msg.senderId.toString() === req.user.id;

    if (deleteFor === "everyone") {
      if (!isSender) return res.status(403).json({ message: "Only sender can delete for everyone" });
      msg.isDeletedForSender = true;
      msg.isDeletedForReceiver = true;
      await msg.save();
      io.to(msg.chat.toString()).emit("messageDeleted", { msgId: msg._id, deleteFor: "everyone" });
    } else {
      if (isSender) msg.isDeletedForSender = true;
      else msg.isDeletedForReceiver = true;
      await msg.save();
    }

    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ── DELETE multiple messages ──────────────────────────────────────────────────
router.delete("/messages", authMiddleware, async (req, res) => {
  try {
    const { messageIds, deleteFor } = req.body;
    const msgs = await Message.find({ _id: { $in: messageIds } });

    for (const msg of msgs) {
      const isSender = msg.senderId.toString() === req.user.id;
      if (deleteFor === "everyone" && isSender) {
        msg.isDeletedForSender = true;
        msg.isDeletedForReceiver = true;
      } else if (isSender) {
        msg.isDeletedForSender = true;
      } else {
        msg.isDeletedForReceiver = true;
      }
      await msg.save();
    }

    if (deleteFor === "everyone") {
      const chatId = msgs[0]?.chat?.toString();
      if (chatId) io.to(chatId).emit("messagesDeleted", { messageIds, deleteFor: "everyone" });
    }

    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ── TOGGLE favourite ──────────────────────────────────────────────────────────
router.patch("/messages/:msgId/favourite", authMiddleware, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.msgId);
    if (!msg) return res.status(404).json({ message: "Not found" });
    msg.isFavourite = !msg.isFavourite;
    await msg.save();
    res.json(msg);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ── DELETE entire chat (only for the requester) ───────────────────────────────
router.delete("/:chatId", authMiddleware, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ message: "Not found" });
    if (!chat.participants.includes(req.user.id))
      return res.status(403).json({ message: "Unauthorized" });

    // Mark all messages as deleted for this user
    await Message.updateMany(
      { chat: req.params.chatId, senderId: req.user.id },
      { isDeletedForSender: true }
    );
    await Message.updateMany(
      { chat: req.params.chatId, receiverId: req.user.id },
      { isDeletedForReceiver: true }
    );

    // Hide the chat from this user's list — don't delete from DB
    if (!chat.deletedFor.includes(req.user.id)) {
      chat.deletedFor.push(req.user.id);
      await chat.save();
    }

    res.json({ message: "Chat removed from your list" });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

export default router;
