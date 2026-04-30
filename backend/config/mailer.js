import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS 
  }
});

export const sendResetEmail = async (toEmail, resetLink) => {
  await transporter.sendMail({
    from: `"CropDesk" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Reset your CropDesk password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border-radius:10px;background:#f9f9f9;border:1px solid #e0e0e0">
        <h2 style="color:#27ae60;margin-bottom:8px">🌾 CropDesk</h2>
        <h3 style="color:#2c3e50">Password Reset Request</h3>
        <p style="color:#555">We received a request to reset your password. Click the button below to set a new one.</p>
        <a href="${resetLink}" style="display:inline-block;margin:20px 0;padding:12px 28px;background:#27ae60;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
          Reset Password
        </a>
        <p style="color:#888;font-size:13px">This link expires in <strong>1 hour</strong>. If you didn't request this, ignore this email.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#aaa;font-size:12px">CropDesk — Your Farming Marketplace</p>
      </div>
    `
  });
};

export const sendWelcomeEmail = async (toEmail, fname, role) => {
  const roleText = role === 'farmer'
    ? 'As a <strong>Farmer</strong>, you can now list your crops, set your price, and connect directly with dealers across India — no middlemen.'
    : 'As a <strong>Dealer</strong>, you can now browse fresh crops from verified farmers, filter by quality and location, and contact sellers directly.';

  await transporter.sendMail({
    from: `"CropDesk" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Welcome to CropDesk, ${fname}! 🌾`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f7f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f4;padding:40px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a6b4a 0%,#27ae60 100%);padding:40px 40px 32px;text-align:center;">
            <div style="font-size:42px;margin-bottom:8px;">🌾</div>
            <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">CropDesk</h1>
            <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Your Farming Marketplace</p>
          </td>
        </tr>

        <!-- Welcome message -->
        <tr>
          <td style="padding:40px 40px 24px;">
            <h2 style="color:#1a6b4a;font-size:22px;margin:0 0 12px;">Welcome to the family, ${fname}! 🎉</h2>
            <p style="color:#444;font-size:15px;line-height:1.7;margin:0 0 16px;">
              We're thrilled to have you on board. CropDesk is built to bridge the gap between farmers and dealers — making agriculture simpler, faster, and fairer for everyone.
            </p>
            <p style="color:#444;font-size:15px;line-height:1.7;margin:0 0 24px;">
              ${roleText}
            </p>
          </td>
        </tr>

        <!-- What you can do -->
        <tr>
          <td style="padding:0 40px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0faf4;border-radius:12px;padding:24px;">
              <tr><td>
                <p style="color:#1a6b4a;font-weight:700;font-size:14px;margin:0 0 16px;text-transform:uppercase;letter-spacing:0.5px;">What you can do on CropDesk</p>
                <table cellpadding="0" cellspacing="0">
                  <tr><td style="padding:6px 0;color:#333;font-size:14px;">✅ &nbsp; Browse the live crop marketplace</td></tr>
                  <tr><td style="padding:6px 0;color:#333;font-size:14px;">✅ &nbsp; Chat directly with farmers or dealers</td></tr>
                  <tr><td style="padding:6px 0;color:#333;font-size:14px;">✅ &nbsp; Filter crops by category, quality & location</td></tr>
                  <tr><td style="padding:6px 0;color:#333;font-size:14px;">✅ &nbsp; Manage your profile and listings</td></tr>
                </table>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- CTA Button -->
        <tr>
          <td style="padding:0 40px 40px;text-align:center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/feed"
              style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#1a6b4a,#27ae60);color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:700;letter-spacing:0.3px;">
              Explore the Marketplace →
            </a>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #eee;"/></td></tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;text-align:center;">
            <p style="color:#999;font-size:13px;margin:0 0 6px;">Need help? Reply to this email or visit our website.</p>
            <p style="color:#999;font-size:12px;margin:0;">© ${new Date().getFullYear()} CropDesk. All rights reserved.</p>
            <p style="color:#bbb;font-size:11px;margin:8px 0 0;">You received this email because you created an account on CropDesk.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
    `
  });
};

export const sendOtpEmail = async (toEmail, fname, otp) => {
  await transporter.sendMail({
    from: `"CropDesk" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `${otp} is your CropDesk verification code`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border-radius:10px;background:#f9f9f9;border:1px solid #e0e0e0">
        <h2 style="color:#27ae60;margin-bottom:4px">🌾 CropDesk</h2>
        <h3 style="color:#2c3e50">Verify your email address</h3>
        <p style="color:#555">Hi ${fname}, use the code below to verify your CropDesk account.</p>
        <div style="text-align:center;margin:28px 0">
          <span style="font-size:40px;font-weight:800;letter-spacing:10px;color:#1a6b4a;background:#e8f5e9;padding:16px 28px;border-radius:10px;display:inline-block">${otp}</span>
        </div>
        <p style="color:#888;font-size:13px">This code expires in <strong>10 minutes</strong>. If you didn't create an account, ignore this email.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
        <p style="color:#aaa;font-size:12px">CropDesk — Your Farming Marketplace</p>
      </div>
    `
  });
};
