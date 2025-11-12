import express from 'express';
import multer from 'multer';

import { 
    createAnnouncement, 
    getLatestAnnouncement, 
    getAllAnnouncements 
} from '../../Controllers/Announcement/AnnouncementController.js';

import { verifyToken } from '../../Middleware/authMiddleware.js';

const router = express.Router();

// Multer configuration: save announcement images to public/uploads/announcements
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/announcements');
    },
    filename: function (req, file, cb) {
        // Keep original extension but create a timestamped filename
        const ext = file.originalname.split('.').pop();
        const filename = `${Date.now()}-${Math.round(Math.random()*1e9)}.${ext}`;
        cb(null, filename);
    }
});
const upload = multer({ storage });

// Accept optional image file under field name 'image'
router.post('/create', verifyToken, upload.single('image'), createAnnouncement);

router.get('/latest', getLatestAnnouncement);

router.get('/all', verifyToken, getAllAnnouncements);

export default router;