import express from "express";
import {
  createAdmin,
  login,
  logoutAdmin,
  verifyOtp,
  getAllAdmins,
  updateAdmin,
  sendForgetPasswordOtp,
  resetPasswordWithOtp,
  deleteAdminById,
  profile
} from "../../Controllers/Admin/logincontroller.js";

const router = express.Router();

// POST request to create a new admin
router.post("/createadmin", createAdmin);

//admin login
router.post("/adminlogin", login);

// admin logout 
router.post("/adminlogout", logoutAdmin);

// First-time OTP verification
router.post("/verify-otp", verifyOtp);

// Admin Forget password
router.post("/forgot-password", sendForgetPasswordOtp);

// Admin reset password
router.post("/reset-password", resetPasswordWithOtp);

// Route to get all admin details
router.get("/get-admins", getAllAdmins);

// Route to get current admin profile (protected route using JWT token)
router.get("/profile", profile);

// Add this line for PUT
router.put("/update/:id", updateAdmin);

// Route to delete an admin by ID
router.delete("/admin/:id", deleteAdminById);


export default router;
