import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  role: { type: String, enum: ["farmer", "dealer"], required: true },
  fname: { type: String, required: true },
  lname: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  profileImage: { type: String, default: "" },
  phone: { type: String, default: "" },
  address: {
    street: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" }
  },
  bio: { type: String, default: "" },
  resetPasswordToken: { type: String },
  resetPasswordExpiry: { type: Date },
  isVerified: { type: Boolean, default: false },
  emailOtp: { type: String },
  emailOtpExpiry: { type: Date }
});

export default mongoose.model("User", userSchema);
