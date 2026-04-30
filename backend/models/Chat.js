import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  lastMessage: { type: String, default: "" },
  lastMessageTime: { type: Date, default: Date.now },
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

const messageSchema = new mongoose.Schema({
  chat:       { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
  senderId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message:    { type: String, required: true },
  messageType:{ type: String, enum: ["text", "image"], default: "text" },
  status:     { type: String, enum: ["sent", "delivered", "seen"], default: "sent" },
  isEdited:   { type: Boolean, default: false },
  isDeletedForSender:   { type: Boolean, default: false },
  isDeletedForReceiver: { type: Boolean, default: false },
  isFavourite:{ type: Boolean, default: false }
}, { timestamps: true });

export const Chat = mongoose.model("Chat", chatSchema);
export const Message = mongoose.model("Message", messageSchema);
