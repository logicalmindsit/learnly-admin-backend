//student-compliant-records-model.js
import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: '"User',
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Resolved", "Rejected"],
      default: "Pending",
    },
    adminReply: {
      type: String,
      default: "",
    },
    resolvedAt: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const StudentComplaint = mongoose.model("Student-Complaint", complaintSchema);
export default StudentComplaint;