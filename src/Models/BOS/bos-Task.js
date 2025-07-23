import { Schema, model } from "mongoose";

const TaskSchema = new Schema({
  task_id: { type: String, required: true, unique: true },
  meeting_id: { type: String, required: true },
  assigned_to: { type: String, required: true },
  description: { type: String, required: true },
  due_date: { type: Date, required: true },
  status: { 
    type: String, 
    required: true,
    enum: ['pending', 'in-progress', 'completed', 'overdue'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

TaskSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default model("Bos-Task", TaskSchema);
