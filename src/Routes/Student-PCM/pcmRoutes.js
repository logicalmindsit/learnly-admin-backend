import express from "express";
import {
  createPostclass,
  listPostclasses,
  updatePostclass,
  deletePostclass,
} from "../../Controllers/Student-PCM/PCM-controllers.js";

const router = express.Router();

// Create a new PCM class
router.post("/classes", createPostclass);

// Get all PCM classes with optional filters
router.get("/classes-all", listPostclasses);

// Update a PCM class
router.put("/classes/:id", updatePostclass);

// Delete a PCM class
router.delete("/classes/:id", deletePostclass);

export default router;
