import express from "express";
import { createTutor, getAllTutors, approveTutor } from "../../Controllers/Tutor/Tutor-Controller.js";

const router = express.Router();

// Create Tutor
router.post("/create-tutor", createTutor);

// Get All Tutors
router.get("/all-tutors", getAllTutors);

// Approve Tutor (marks isApproved = true) - frontend should call this after final save / T&C acceptance
router.patch("/approve-tutor", approveTutor);

export default router;
