//direct-meet-study-material-model.js
import mongoose from "mongoose";
const DirectMeetStudyMaterialSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: {type: String},
    uploadedBy: {type: mongoose.Schema.Types.ObjectId,ref: 'Staff',required: true},
    uploadedAt: { type: Date, default: Date.now }
  }, { timestamps: true });
  
const DirectMeetStudyMaterial = mongoose.model('Direct-Meet-Study-Material', DirectMeetStudyMaterialSchema);
export default DirectMeetStudyMaterial;