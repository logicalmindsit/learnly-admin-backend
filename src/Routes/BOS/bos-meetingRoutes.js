import { Router } from 'express';
import { createMeeting, getMeetingById } from '../../Controllers/BOS/bos-meetingController.js';

const router = Router();

// Create a new meeting
router.post('/create-meetings', createMeeting);

// Get a specific meeting by ID
router.get('/meetings/:id', getMeetingById);

export default router;
