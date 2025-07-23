//exam-mark-records-model.js
import mongoose from 'mongoose';

const examMarkSchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    studentId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    grade: {
      type: String,
      required: true,
      enum: ['A+', 'A', 'B', 'C', 'D', 'E', 'F'],
      default:null,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    mark: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ['Pass', 'Fail', 'Absent'],
      default:null,
    },
  },
  {
    timestamps: true, 
  }
);

const ExamMarkRecords = mongoose.model('ExamMarkRecords', examMarkSchema);
export default ExamMarkRecords;