// File: admin-backend/src/Routes/NotificationBell/materialRoutes.js

import express from 'express';
import multer from 'multer';
import path from 'path';

// Unga MaterialController-oda sariyaana path-a inga kudunga
import { sendMaterial } from '../../Controllers/Notificationbell/MaterialController.js';

const router = express.Router();

// Multer setup (file upload-kaaga)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Unga project-la 'uploads/materials' nu oru folder irukkaanu uruthi paduthikonga
    cb(null, './uploads/materials'); 
  },
  filename: (req, file, cb) => {
    // File name duplicate aagama irukka, date-a serkrom
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Route definition
router.post('/send', upload.single('materialPdf'), sendMaterial);

// ✅ MIGAVUM MUKKIYAMANA LINE (Idhu thaan munnadi miss aachu)
export default router;