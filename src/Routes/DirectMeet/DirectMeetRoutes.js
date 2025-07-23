import express from 'express';
import {
  createDirectMeet,
  getAllDirectMeets,
  getDirectMeetById,
  getDirectMeetByMeetId,
  updateDirectMeet,
  deleteDirectMeet,
  softDeleteDirectMeet,
  getActiveDirectMeets,
  getUpcomingDirectMeets,
  markDirectMeetCompleted,
  getDirectMeetStats,
  sendDirectMeetNotification
} from '../../Controllers/DirectMeet/DirectMeetController.js';

const router = express.Router();

// Core CRUD Routes
router.post('/create-direct-meet', createDirectMeet);
router.get('/get-all-direct-meets', getAllDirectMeets);
router.get('/get-direct-meet/:id', getDirectMeetById);
router.get('/get-direct-meet-by-meet-id/:meet_id', getDirectMeetByMeetId);
router.put('/update-direct-meet/:id', updateDirectMeet);
router.delete('/delete-direct-meet/:id', deleteDirectMeet);
router.patch('/soft-delete-direct-meet/:id', softDeleteDirectMeet);

// Special Routes
router.get('/get-active-direct-meets', getActiveDirectMeets);
router.get('/get-upcoming-direct-meets', getUpcomingDirectMeets);
router.patch('/mark-direct-meet-completed/:id', markDirectMeetCompleted);
router.get('/get-direct-meet-stats', getDirectMeetStats);
router.post('/send-notification/:id', sendDirectMeetNotification);

export default router;
