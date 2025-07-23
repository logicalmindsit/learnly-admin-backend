import Admin from "../../Models/Admin/Modellogin.js";
import bcrypt from "bcrypt";
import { JwtToken } from "../../Utils/JwtToken.js";
import { generateOtp } from "../../Utils/OTPGenerate.js";
import { sendOtpEmail } from "../../Utils/EmailTransport.js";
import { sendWelcomeEmail,sendRemoveAdminEmail,} from "../../Utils/Adminwelcomemail.js";
import { validationResult } from "express-validator";

// Generate member ID for BOS roles
const generateMemberId = async (role) => {
  const currentYear = new Date().getFullYear().toString();
  const uniqueId = Math.random().toString(36).substring(2, 6).toUpperCase();

  const count = await Admin.countDocuments({
    role,
    "bosDetails.member_id": new RegExp(`^${currentYear}`),
  });

  const paddedCount = (count + 1).toString().padStart(3, "0");

  if (role === "boscontroller") {
    return `${currentYear}${paddedCount}`; // e.g., 2025001
  } else if (role === "bosmembers") {
    return `${currentYear}${uniqueId}${paddedCount}`; // e.g., 2025ABCD001
  }
  return null;
};

// Create Admin Controller
export const createAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ errors: errors.array() });

    const {
      name,
      email,
      mobilenumber,
      password,
      conformpassword,
      gender,
      role,
      bosDetails,
    } = req.body;

    if (password !== conformpassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedMobile = mobilenumber.trim();

    const existingAdmin = await Admin.findOne({
      $or: [{ email: normalizedEmail }, { mobilenumber: normalizedMobile }],
    });
    if (existingAdmin) {
      return res
        .status(400)
        .json({ message: "Email or Mobile already exists" });
    }

    // Generate member ID if BOS role
    let generatedMemberId = null;
    if (role === "bosmembers" || role === "boscontroller") {
      if (
        !bosDetails ||
        !bosDetails.designation ||
        !bosDetails.joining_date ||
        !bosDetails.term_end
      ) {
        return res.status(400).json({
          message:
            "BOS member details (designation, joining_date, term_end) are required",
        });
      }

      generatedMemberId = await generateMemberId(role);
      if (!generatedMemberId) {
        return res
          .status(500)
          .json({ message: "Failed to generate member ID" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      name,
      email: normalizedEmail,
      mobilenumber: normalizedMobile,
      password: hashedPassword,
      gender,
      role,
      ...(role === "bosmembers" || role === "boscontroller"
        ? {
            bosDetails: {
              ...bosDetails,
              member_id: generatedMemberId,
              joining_date: new Date(bosDetails.joining_date),
              term_end: new Date(bosDetails.term_end),
            },
          }
        : {}),
    });

    await newAdmin.save();

    await sendWelcomeEmail({
      name,
      email: normalizedEmail,
      mobilenumber: normalizedMobile,
      gender,
      role,
      ...(role === "bosmembers" || role === "boscontroller"
        ? { bosDetails: newAdmin.bosDetails }
        : {}),
    });

    const { password: _, ...adminData } = newAdmin.toObject();
    res
      .status(201)
      .json({ message: "Admin created successfully", admin: adminData });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// First Time OTP Verification
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await Admin.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });
    if (user.otpExpiresAt < new Date())
      return res.status(400).json({ message: "OTP has expired" });

    // Clear first time flags
    user.isFirstTime = false;
    user.otp = undefined;
    user.otpExpiresAt = undefined;

    // Track login time (optional for consistency)
    const loginEntry = {
      loginTime: new Date(),
      ipAddress: req.ip || req.headers["x-forwarded-for"] || "Unknown",
      userAgent: req.headers["user-agent"] || "Unknown",
    };
    user.loginHistory.push(loginEntry);

    await user.save();

    // Generate token
    const token = JwtToken(user);

    // Send full login response
    return res.status(200).json({
      success: true,
      message: "Email verified and login successful",
      id: user.id,
      token,
      role: user.role,
      name: user.name,
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

    const user = await Admin.findOne({
      $or: [{ email }, { mobilenumber: email }],
    });

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

    const token = JwtToken(user);

    // ✅ Track login history (only this remains)
    const loginEntry = {
      loginTime: new Date(),
      ipAddress: req.ip || req.headers["x-forwarded-for"] || "Unknown",
      userAgent: req.headers["user-agent"] || "Unknown",
    };
    user.loginHistory.push(loginEntry);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Login successful",
      id: user.id,
      token,
      role: user.role,
      name: user.name,
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

    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }

    const now = new Date();

    // Find the most recent login without logoutTime
    const latestSession = admin.loginHistory
      .slice()
      .reverse()
      .find((session) => !session.logoutTime);

    if (latestSession) {
      latestSession.logoutTime = now;
      latestSession.sessionDuration = Math.floor(
        (now - new Date(latestSession.loginTime)) / (1000 * 60)
      ); // Duration in minutes
    }

    await admin.save();

    res.status(200).json({
      success: true,
      message: "Logout successful and session recorded",
      lastSession: latestSession || null,
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
    const user = await Admin.findOne({ email });
    if (!user) return res.status(404).json({ message: "Admin not found" });

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
    const user = await Admin.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
    });

    if (!user) return res.status(404).json({ message: "Admin not found" });

    // Security: OTP attempt tracking
    if (user.otpAttempts >= 3) {
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

// Get All Admins
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find();
    res.status(200).json(admins);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching admins", error: error.message });
  }
};

// Get Admin by Email (for profile)
export const profile = async (req, res) => {
  try {
    // Get email from JWT token (set by auth middleware)
    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: "Unauthorized: Email not found in token" });
    }

    const email = req.user.email;

    const admin = await Admin.findOne({ 
      email: email.toLowerCase().trim() 
    }).select('-password -otp -otpExpiresAt -forgotPasswordOtp -forgotPasswordOtpExpiresAt -otpAttempts');

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json({
      success: true,
      message: "Admin profile retrieved successfully",
      admin: admin
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching admin profile", 
      error: error.message 
    });
  }
};

// Update Admin
export const updateAdmin = async (req, res) => {
  try {
    const updatedAdmin = await Admin.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updatedAdmin)
      return res.status(404).json({ message: "Admin not found" });

    res
      .status(200)
      .json({ message: "Admin updated successfully", admin: updatedAdmin });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating admin", error: error.message });
  }
};

// Delete Admin
export const deleteAdminById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find admin before deleting to get email, name, role
    const adminToDelete = await Admin.findById(id);

    if (!adminToDelete) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }

    const deletedAdmin = await Admin.findByIdAndDelete(id);

    // ✅ Send removal email
    await sendRemoveAdminEmail({
      name: adminToDelete.name,
      email: adminToDelete.email,
      role: adminToDelete.role,
    });

    return res.status(200).json({
      success: true,
      message: "Admin deleted and notified successfully",
      data: deletedAdmin,
    });
  } catch (error) {
    console.error("Error deleting admin:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
