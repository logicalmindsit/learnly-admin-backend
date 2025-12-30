import express from 'express';
import {createStaff,getAllStaff,updateStaff,deleteStaff} from '../../Controllers/Data-Maintenance/staff-details.js';
import multer from 'multer';
const router = express.Router();

// Configure multer for file upload with memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create new staff
router.post('/post-create-staff', upload.single('profilePicture'), createStaff);

// Get all staff with pagination
router.get('/get-staff-all', getAllStaff);

// Update staff
router.put('/update-staff/:id/image', upload.single('profilePicture'), updateStaff);

// Delete staff
router.delete('/delete-staff/:id', deleteStaff);

export default router;