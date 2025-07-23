import express from "express";
import { createExamQuestion,getExamQuestionsByCourseAndChapter,
    getAllExams,updateExam,deleteExam,getExamById} from "../../Controllers/Courses/QuestionController.js"
const router = express.Router();

router.post("/exam/upload", createExamQuestion);
router.get("/exam-question", getExamQuestionsByCourseAndChapter);





router.get("/exam/all", getAllExams); 
router.get("/exam/:id", getExamById);    
router.put("/exam/update/:id", updateExam);   
router.delete("/exam/delete/:id", deleteExam); 

export default router;
