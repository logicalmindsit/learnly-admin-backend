import express from "express";
import { createExamQuestion,getExamQuestionsByCourseAndChapter,updateExam,deleteExam} from "../../Controllers/Courses/QuestionController.js"
const router = express.Router();

// Create a new exam question
router.post("/exam/upload", createExamQuestion);

// Get exam questions by course name and chapter title
router.get("/exam-question", getExamQuestionsByCourseAndChapter);

// update exam question
router.put("/exam/update/:id", updateExam);   

// delete exam question
router.delete("/exam/delete/:id", deleteExam); 

export default router;
