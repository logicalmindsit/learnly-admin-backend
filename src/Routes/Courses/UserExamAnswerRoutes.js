import express from "express";
import {
  getUserExamAttempts,
  getCourseExamAttempts,
  getExamAttempts,
  getExamAttemptById,
  getChapterExamAttempts,
  getUserExamStats,
  deleteExamAttempt,
  getAllExamAttempts
} from "../../Controllers/Courses/UserExamAnswerController.js";

const router = express.Router();

// Get user's exam attempts
router.get("/user/:userId", getUserExamAttempts);

// Get user's exam statistics
router.get("/user/:userId/stats", getUserExamStats);

// Get course exam attempts
router.get("/course/:courseId", getCourseExamAttempts);

// Get exam attempts for specific exam
router.get("/exam/:examId", getExamAttempts);

// Get chapter exam attempts
router.get("/chapter/:courseId/:chapterTitle", getChapterExamAttempts);

// Get specific exam attempt by ID
router.get("/attempt/:attemptId", getExamAttemptById);

// Get all exam attempts (admin)
router.get("/all", getAllExamAttempts);

// Delete exam attempt (admin)
router.delete("/attempt/:attemptId", deleteExamAttempt);

export default router;
