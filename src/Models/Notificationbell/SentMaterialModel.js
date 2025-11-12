// File: backend/src/Models/SentMaterialModel.js
import mongoose from 'mongoose';

const sentMaterialSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  materialName: { type: String, required: true },
  filePath: { type: String, required: true }, // e.g., /uploads/materials/169555.pdf
  courseName: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
});

const SentMaterial = mongoose.model('SentMaterial', sentMaterialSchema);
export default SentMaterial;