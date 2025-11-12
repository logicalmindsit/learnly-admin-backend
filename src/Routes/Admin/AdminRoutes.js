
import express from "express";
import {
  createAdmin,
  getAllAdmins,
  updateAdmin,
  deleteAdminById,
  profile
} from "../../Controllers/Admin-Tutor-auth/Admin-controller.js";


const router = express.Router();

// Admin Routes

// POST - Create a new admin
router.post("/createadmin", createAdmin);

// GET - Retrieve all admins
router.get("/get-admins", getAllAdmins);

// Update admin by ID
router.put("/update/:id", updateAdmin);

// DELETE - Delete admin by ID
router.delete("/admin/:id",  deleteAdminById);

// GET - Admin Profile
router.get("/profile",  profile);

export default router;
