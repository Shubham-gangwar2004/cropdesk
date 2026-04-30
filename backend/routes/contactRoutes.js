import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

router.post("/", async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !subject || !message)
    return res.status(400).json({ message: "All required fields must be filled." });

  try {
    await transporter.sendMail({
      from: `"CropDesk Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: `[CropDesk Contact] ${subject}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:28px;background:#f9f9f9;border-radius:10px;border:1px solid #e0e0e0">
          <h2 style="color:#27ae60;margin-bottom:4px">🌾 New Contact Message</h2>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
          <p><strong>Subject:</strong> ${subject}</p>
          <div style="background:white;padding:16px;border-radius:8px;margin-top:12px;border-left:4px solid #27ae60">
            <p style="margin:0;white-space:pre-wrap">${message}</p>
          </div>
          <p style="color:#aaa;font-size:12px;margin-top:20px">Sent from CropDesk contact form</p>
        </div>
      `
    });
    res.json({ message: "Message sent successfully!" });
  } catch (err) {
    console.error("Contact email error:", err.message);
    res.status(500).json({ message: "Failed to send message. Please try again." });
  }
});

export default router;
