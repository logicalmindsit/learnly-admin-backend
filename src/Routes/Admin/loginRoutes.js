
import express from "express";
import {
  login,
  logoutAdmin,
  verifyOtp,
  sendForgetPasswordOtp,
  resetPasswordWithOtp,  
} from "../../Controllers/Admin-Tutor-auth/logincontroller.js";


const router = express.Router();

// Admin Authentication Routes

// Admin Login
router.post("/adminlogin", login);

// Admin Logout
router.post("/adminlogout", logoutAdmin);

// Verify OTP 
router.post("/verify-otp", verifyOtp);

// Forgot Password - Send OTP and Reset Password
router.post("/forgot-password", sendForgetPasswordOtp);

// Reset Password with OTP
router.post("/reset-password", resetPasswordWithOtp);

export default router;
