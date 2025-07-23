import express from "express";
import {addStudyMaterial,getAllStudyMaterials,getStudyMaterialById,updateStudyMaterial,deleteStudyMaterial} from "../../Controllers/Data-Maintenance/direct-meet-study-material-controller.js"    
import multer from 'multer';

const router = express.Router();

// Use memory storage for file handling
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Routes

router.post("/direct-meet-study-material/post",upload.single("file"),  addStudyMaterial);
router.get("/direct-meet-study-material/get", getAllStudyMaterials);
router.get("/direct-meet-study-material/:id", getStudyMaterialById);
router.put("/direct-meet-study-material/:id", updateStudyMaterial);
router.delete("/direct-meet-study-material/:id", deleteStudyMaterial);

export default router;