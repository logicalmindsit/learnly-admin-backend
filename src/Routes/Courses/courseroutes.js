import express from "express";
import multer from "multer";
import {
  createCourse,
  getCourseNames,
  getCourseByName,
  updateCourse
} from "../../Controllers/Courses/coursecontroller.js";

// Initialize router
const router = express.Router();

// Multer config: store uploaded files in memory
const upload = multer({ storage: multer.memoryStorage() });

// POST - Create a new course with multimedia files
router.post("/createcourses", upload.any(), createCourse);

// GET - Retrieve courses name
router.get("/getcoursesname", getCourseNames );

// GET - Retrieve courses
router.get("/courses/:coursename", getCourseByName);

// PUT - Update course by ID (add chapters/lessons/media)
router.put("/course/update/:coursename", upload.any(), updateCourse);

export default router;
