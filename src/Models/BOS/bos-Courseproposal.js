import { Schema, model } from "mongoose";

const CourseProposalSchema = new Schema({
  Proposal_id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  department: { type: String, required: true },
  syllabus: { type: String },
  Proposal_by: { type: String, required: true },
  document_link: { type: String },
  pdf_file: { type: String },
  submited_on: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

CourseProposalSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default model("Bos-CourseProposal", CourseProposalSchema);
