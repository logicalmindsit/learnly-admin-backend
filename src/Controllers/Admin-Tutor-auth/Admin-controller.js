import Admin from "../../Models/Admin/Admin-login-Model.js";
import Tutor from "../../Models/Tutor/TutorModel.js";

import bcrypt from "bcrypt";
import { validationResult } from "express-validator";
import {
  sendWelcomeEmail,
  sendRemoveAdminEmail,
} from "../../Notification/Adminwelcomemail.js";

// Generate member ID for BOS roles
const generateMemberId = async (role) => {
  const currentYear = new Date().getFullYear().toString();
  const uniqueId = Math.random().toString(36).substring(2, 6).toUpperCase();
  const count = await Admin.countDocuments({
    role,
    "bosDetails.member_id": new RegExp(`^${currentYear}`),
  });
  const paddedCount = (count + 1).toString().padStart(3, "0");
  if (role === "boscontroller") return `${currentYear}${paddedCount}`;
  if (role === "bosmembers") return `${currentYear}${uniqueId}${paddedCount}`;
  return null;
};

// Base64 validation (limit 100MB)
const MAX_BASE64_SIZE = 100 * 1024 * 1024 * 1.33; // ≈133MB
const validateBase64Size = (base64String, label = "Image") => {
  if (!base64String) return true;
  const sizeInBytes = (base64String.length * 3) / 4;
  if (sizeInBytes > MAX_BASE64_SIZE) {
    throw new Error(`${label} exceeds 100MB size limit`);
  }
  return true;
};

// ✅ UPDATED CREATE ADMIN CONTROLLER
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
      age,
      permanentAddress,
      tempAddress,
      role,
      bosDetails,
      govtIdProofs,
      profilePictureBase64,
    } = req.body;

    if (password !== conformpassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedMobile = mobilenumber.trim();

    // Check existing admin
    const existingAdmin = await Admin.findOne({
      $or: [{ email: normalizedEmail }, { mobilenumber: normalizedMobile }],
    });
    if (existingAdmin) {
      return res
        .status(400)
        .json({ message: "Email or Mobile number already exists" });
    }

    // Handle BOS member logic
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
    }

    // Validate Base64 image sizes
    if (profilePictureBase64)
      validateBase64Size(profilePictureBase64, "Profile picture");

    if (govtIdProofs?.length) {
      for (const proof of govtIdProofs) {
        if (proof.documentImageBase64) {
          validateBase64Size(
            proof.documentImageBase64,
            `${proof.idType} image`
          );
        }
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Construct admin object
    const newAdmin = new Admin({
      name,
      email: normalizedEmail,
      mobilenumber: normalizedMobile,
      password: hashedPassword,
      gender,
      age,
      permanentAddress,
      tempAddress,
      role,
      // ✅ Save base64 string into DB field 'profilePictureUpload'
      profilePictureUpload: profilePictureBase64 || null,
      // ✅ Map government proofs and rename documentImageBase64 → documentImage
      govtIdProofs:
        govtIdProofs?.map((proof) => ({
          idType: proof.idType,
          idNumber: proof.idNumber,
          documentImage: proof.documentImageBase64 || null,
        })) || [],
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

    // Send welcome email
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

    // Exclude password before returning
    const { password: _, ...adminData } = newAdmin.toObject();

    res.status(201).json({
      message: "Admin created successfully",
      admin: adminData,
    });
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    res.status(500).json({ message: "Server error", error: error.message });
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

// Get Admin by Email (for profile)
export const profile = async (req, res) => {
  try {
    // 1️⃣ Validate JWT payload
    if (!req.user || !req.user.email) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Email not found in token",
      });
    }

    const { email, role } = req.user; // role can be 'tutor', 'superadmin', 'bosmembers', etc.
    let userProfile = null;
    let userType = "unknown";

    // 2️⃣ Try Admin first (multiple roles supported)
    userProfile = await Admin.findOne({
      email: email.toLowerCase().trim(),
    }).select(
      "-password -otp -otpExpiresAt -forgotPasswordOtp -forgotPasswordOtpExpiresAt -otpAttempts"
    );

    if (userProfile) {
      userType = "admin";
    } else {
      // 3️⃣ If not admin, try Tutor
      userProfile = await Tutor.findOne({
        email: email.toLowerCase().trim(),
      }).select(
        "-password -otp -otpExpiresAt -forgotPasswordOtp -forgotPasswordOtpExpiresAt -otpAttempts"
      );
      if (userProfile) {
        userType = "tutor";
      }
    }

    // 4️⃣ If no matching record
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "User not found in Admin or Tutor records",
      });
    }

    // 5️⃣ Response (handles admin with multiple roles)
    res.status(200).json({
      success: true,
      message: `${userType === "admin" ? "Admin" : "Tutor"} profile retrieved successfully`,
      userType,
      role: userProfile.role, // could be 'superadmin', 'boscontroller', 'tutor', etc.
      profile: userProfile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user profile",
      error: error.message,
    });
  }
};