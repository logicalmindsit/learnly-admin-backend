import Admin from "../../Models/Admin/Admin-login-Model.js";
import Tutor from "../../Models/Tutor/TutorModel.js";

import bcrypt from "bcrypt";

import { JwtToken } from "../../Utils/JwtToken.js";
import { generateOtp } from "../../Utils/OTPGenerate.js";
import { sendOtpEmail } from "../../Notification/Email-otp.js";


// First Time OTP Verification
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    // Try Admin first, then Tutor
    let user = await Admin.findOne({ email });
    let modelType = "Admin";
    if (!user) {
      user = await Tutor.findOne({ email });
      modelType = user ? "Tutor" : modelType;
    }

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });
    if (user.otpExpiresAt < new Date())
      return res.status(400).json({ message: "OTP has expired" });

    // Clear first time flags
    user.isFirstTime = false;
    user.otp = undefined;
    user.otpExpiresAt = undefined;

    // Track login time
    // Track login time (include placeholders for logout/session duration)
    const loginEntry = {
      loginTime: new Date(),
      ipAddress: req.ip || req.headers["x-forwarded-for"] || "Unknown",
      userAgent: req.headers["user-agent"] || "Unknown",
      logoutTime: null,
      sessionDuration: null,
    };
    if (!Array.isArray(user.loginHistory)) user.loginHistory = [];
    user.loginHistory.push(loginEntry);

    await user.save();

    // Generate token (include a simple role hint)
    const token = JwtToken({ 
      _id: user._id, 
      email: user.email, 
      role: user.role, 
      name: user.name,
      ...(user.role === "tutor" ? { isApproved: user.isApproved } : {})
    });

    // Send full login response
    return res.status(200).json({
      success: true,
      message: "Email verified and login successful",
      id: user.id,
      token,
      role: user.role || modelType,
      name: user.name,
      ...(user.role === "tutor" ? { isApproved: user.isApproved } : {})
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Lookup in Admin then Tutor
    // Lookup in Admin then Tutor
    let user = await Admin.findOne({ $or: [{ email }, { mobilenumber: email }] });
    let modelType = "Admin";
    if (!user) {
      // Tutor model uses `mobilenumber` (not `phone`). Try both email and mobilenumber.
      user = await Tutor.findOne({ $or: [{ email }, { mobilenumber: email }] });
      modelType = user ? "Tutor" : modelType;
    }

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isFirstTime) {
      const { otp, otpExpiresAt } = generateOtp();
      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
      await user.save();
      await sendOtpEmail(user.email, otp);

      return res.status(200).json({
        success: true,
        message: "OTP sent to email for first-time verification",
        isFirstTime: true,
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = JwtToken({ 
      _id: user._id, 
      email: user.email, 
      role: user.role, 
      name: user.name,
      ...(user.role === "tutor" ? { isApproved: user.isApproved } : {})
    });

    // Track login history
    // Create login history entry matching the schema fields
    const loginEntry = {
      loginTime: new Date(),
      ipAddress: req.ip || req.headers["x-forwarded-for"] || "Unknown",
      userAgent: req.headers["user-agent"] || "Unknown",
      // Set placeholders for logout and duration (will be updated on logout)
      logoutTime: null,
      sessionDuration: null,
    };
    if (!Array.isArray(user.loginHistory)) user.loginHistory = [];
    user.loginHistory.push(loginEntry);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Login successful",
      id: user.id,
      token,
      role: user.role || modelType,
      name: user.name,
      ...(user.role === "tutor" ? { isApproved: user.isApproved } : {})
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Logout
export const logoutAdmin = async (req, res) => {
  try {
    // Make sure the user is authenticated via middleware
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
    }
    // Support Admin or Tutor
    let user = await Admin.findById(req.user.id);
    let modelType = "Admin";
    if (!user) {
      user = await Tutor.findById(req.user.id);
      modelType = user ? "Tutor" : modelType;
    }
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: `${modelType} not found` });
    }

    const now = new Date();

    // Find the most recent login without logoutTime
    const latestSession = (user.loginHistory || [])
      .slice()
      .reverse()
      .find((session) => !session.logoutTime);

    if (latestSession) {
      latestSession.logoutTime = now;
      latestSession.sessionDuration = Math.floor(
        (now - new Date(latestSession.loginTime)) / (1000 * 60)
      ); // Duration in minutes
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Logout successful and session recorded",
      lastSession: latestSession || null,
      modelType,
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during logout",
      error: error.message,
    });
  }
};

// Forgot Password OTP
export const sendForgetPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;
    // Find in Admin or Tutor
    let user = await Admin.findOne({ email });
    let modelType = "Admin";
    if (!user) {
      user = await Tutor.findOne({ email });
      modelType = user ? "Tutor" : modelType;
    }
    if (!user) return res.status(404).json({ message: `${modelType} not found` });

    const { otp, otpExpiresAt } = generateOtp();
    user.forgotPasswordOtp = otp;
    user.forgotPasswordOtpExpiresAt = otpExpiresAt;
    user.forgotPasswordOtpVerified = false;
    await user.save();

    await sendOtpEmail(email, otp);
    res.status(200).json({ message: "OTP sent to your email address." });
  } catch (err) {
    res.status(500).json({ message: "Error sending OTP", error: err.message });
  }
};

// Reset Password
export const resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, password, confirmPassword } = req.body;

    // Input validation
    if (!email || !otp || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check password match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Find user with case-insensitive email
    // Search in Admin then Tutor (case-insensitive)
    let user = await Admin.findOne({ email: { $regex: new RegExp(`^${email}$`, "i") } });
    let modelType = "Admin";
    if (!user) {
      user = await Tutor.findOne({ email: { $regex: new RegExp(`^${email}$`, "i") } });
      modelType = user ? "Tutor" : modelType;
    }
    if (!user) return res.status(404).json({ message: `${modelType} not found` });

    // Security: OTP attempt tracking
    if ((user.otpAttempts || 0) >= 3) {
      return res.status(429).json({
        message: "Too many attempts. Please request a new OTP.",
      });
    }

    // OTP validation
    if (user.forgotPasswordOtp !== otp) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Check expiration
    if (
      !user.forgotPasswordOtpExpiresAt ||
      user.forgotPasswordOtpExpiresAt < new Date()
    ) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Password validation
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must contain 8+ characters with uppercase, lowercase, number and special character",
      });
    }

    // Password history check (prevent reuse)
    const isPreviousPassword = await bcrypt.compare(password, user.password);
    if (isPreviousPassword) {
      return res.status(400).json({
        message: "Cannot reuse previous password",
      });
    }

    // Hash password with increased cost factor
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user
    user.password = hashedPassword;
    user.forgotPasswordOtp = null;
    user.forgotPasswordOtpExpiresAt = null;
    user.forgotPasswordOtpVerified = true;
    user.otpAttempts = 0; // Reset attempts
    user.passwordUpdatedAt = Date.now();
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({
      message: "Error resetting password",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Internal server error",
    });
  }
};





