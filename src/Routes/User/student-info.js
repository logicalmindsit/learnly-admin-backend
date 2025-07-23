// routes/adminRoutes.js
import express from "express";
import { getUserDetails, getAllUsers } from "../../Controllers/User/student-Info.js";

const router = express.Router();

// Admin routes
router.get("/admin/students",  getAllUsers); // Get all users' details
router.get("/admin/students/:id", getUserDetails); // Get specific user details by _id or studentRegisterNumber

export default router;