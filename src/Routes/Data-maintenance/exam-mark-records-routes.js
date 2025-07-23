import express from "express";
import {
  createStudentNewExamRecords,
  updateStudentExamRecords,
  getAllStudentExamMarks,
  downloadStudentExamRecords,
  getStudentExamStatistics,
} from "../../Controllers/Data-Maintenance/exam-mark-records-controller.js";

const router = express.Router();

router.post('/exam-records/create', createStudentNewExamRecords);

router.put('/exam-records/update/:id', updateStudentExamRecords);

router.get('/exam-records/all', getAllStudentExamMarks);

router.get("/exam-records/download", downloadStudentExamRecords);

router.get("/exam-records/statistics", getStudentExamStatistics);

export default router;
