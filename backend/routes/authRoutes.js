import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";
import { sendResetEmail, sendWelcomeEmail, sendOtpEmail } from "../config/mailer.js";

const router = express.Router();

const withTimeout = (promise, timeoutMs, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);

// ── Register ──────────────────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  const { role, fname, lname, email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      await withTimeout(sendOtpEmail(email, fname, otp), 20000, "OTP email send");
    } catch (mailErr) {
      console.error("OTP email failed:", mailErr.message);
      return res.status(502).json({
        message: "Could not send verification email right now. Please try again in a minute."
      });
    }

    const user = new User({
      role, fname, lname, email, password: hashed,
      emailOtp: otp,
      emailOtpExpiry: Date.now() + 10 * 60 * 1000 // 10 min
    });
    await user.save();

    res.status(201).json({
      message: "Account created! Please check your email for the verification code.",
      email
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ── Verify OTP ────────────────────────────────────────────────────────────────
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.json({ message: "Email already verified" });

    if (!user.emailOtp || user.emailOtp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });
    if (user.emailOtpExpiry < Date.now())
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });

    user.isVerified = true;
    user.emailOtp = undefined;
    user.emailOtpExpiry = undefined;
    await user.save();

    sendWelcomeEmail(email, user.fname, user.role).catch(() => {});

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ message: "Email verified successfully!", token, role: user.role });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ── Resend OTP ────────────────────────────────────────────────────────────────
router.post("/resend-otp", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "Email already verified" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await withTimeout(sendOtpEmail(email, user.fname, otp), 20000, "Resend OTP email send");

    user.emailOtp = otp;
    user.emailOtpExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    res.json({ message: "New OTP sent to your email." });
  } catch (err) {
    res.status(502).json({ message: "Could not resend verification email right now. Please try again." });
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No account found with this email" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

    if (!user.isVerified)
      return res.status(403).json({ message: "Please verify your email first.", email, needsVerification: true });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ message: "Login successful", token, role: user.role });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ── Forgot Password ───────────────────────────────────────────────────────────
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: "If this email exists, a reset link has been sent." });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpiry = Date.now() + 60 * 60 * 1000;
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${token}`;

    try {
      await sendResetEmail(email, resetLink);
    } catch (mailErr) {
      console.error("Email send failed:", mailErr.message);
      // Still respond — don't expose mail errors to client
    }

    res.json({ message: "If this email exists, a reset link has been sent." });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ── Reset Password ────────────────────────────────────────────────────────────
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: "Reset link is invalid or has expired" });

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ── Validate reset token (for frontend to check before showing form) ──────────
router.get("/reset-password/:token/validate", async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpiry: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ valid: false });
    res.json({ valid: true });
  } catch (err) {
    res.status(500).json({ valid: false });
  }
});

// ── Get current user ──────────────────────────────────────────────────────────
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -resetPasswordToken -resetPasswordExpiry");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ── Update profile ────────────────────────────────────────────────────────────
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { fname, lname, phone, bio, address, profileImage } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (fname) user.fname = fname;
    if (lname) user.lname = lname;
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = bio;
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (address) user.address = { ...user.address.toObject?.() ?? user.address, ...address };

    await user.save();
    const updated = await User.findById(req.user.id).select("-password -resetPasswordToken -resetPasswordExpiry");
    res.json({ message: "Profile updated", user: updated });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ── Change password (logged in) ───────────────────────────────────────────────
router.put("/change-password", authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
