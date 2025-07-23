import express from "express";
import {
  getAllUsers,
  updateUserById,
  deleteUserById,
} from "../../Controllers/User/user-controller.js";

const router = express.Router();

// Route Definitions
router.get("/getallusers", getAllUsers);
router.put("/:id", updateUserById);
router.delete("/:id", deleteUserById);

export default router;
