import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Check email verification for protected actions
    const user = await User.findById(decoded.id).select("isVerified");
    if (!user) return res.status(401).json({ message: "User not found" });
    if (!user.isVerified)
      return res.status(403).json({ message: "Please verify your email to access this feature.", needsVerification: true });

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
