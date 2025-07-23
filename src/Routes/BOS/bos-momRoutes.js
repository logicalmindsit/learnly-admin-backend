import express from "express";
import {
  createMoM,
  getAllMoM,
  getMoMById,
  updateMoM,
  deleteMoM,
} from "../../Controllers/BOS/bos-momController.js";

const router = express.Router();

// Create new minutes of meeting
router.post("/create",  createMoM);

// Get all minutes of meetings
router.get("/get-allmom",  getAllMoM);

// Get single minutes of meeting by ID
router.get("/get-mom/:id",  getMoMById);

// Update minutes of meeting
router.put("/update/:id",  updateMoM);

// Delete minutes of meeting
router.delete("/delete/:id",  deleteMoM);

export default router;
