import { Schema, model } from "mongoose";

const MoMSchema = new Schema({
  minutes_id: { type: String, required: true, unique: true },
  meeting_id: { type: String, required: true },
  decisions: { type: String, required: true },
  notes: { type: String },
  action_items: [{ type: String }],
  uploaded_by: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

MoMSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default model("Bos-MoM", MoMSchema);
