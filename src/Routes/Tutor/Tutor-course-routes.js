import express from "express";
import multer from "multer";
import {
  createCourse,
  getCourseNames,
  getCourseByName,
  updateCourse,
  getCoursesByCategory,
  getCoursesByTutor
} from "../../Controllers/Tutor/Tutor-coure-controller.js";

// Initialize router
const router = express.Router();

// Multer config: store uploaded files in memory
const upload = multer({ storage: multer.memoryStorage() });

// POST - Create a new course with multimedia files
router.post("/createcourses-tutors", upload.any(), createCourse);

// GET - Retrieve courses name
router.get("/getcourses-tutors", getCourseNames );

// GET - Retrieve courses
router.get("/courses-tutors/:coursename", getCourseByName);

// PUT - Update course by ID (add chapters/lessons/media)
router.put("/course-tutors/update/:coursename", upload.any(), updateCourse);

// GET - Retrieve courses by category
router.get("/courses-tutors/category/:categoryName", getCoursesByCategory);

// GET - Retrieve courses for authenticated tutor (use token)
router.get("/courses-tutors", getCoursesByTutor);

export default router;
