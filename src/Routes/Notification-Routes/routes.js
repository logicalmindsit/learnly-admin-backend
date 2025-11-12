import express from 'express';
import {
  getNotificationsByRole,
  markNotificationAsRead,
  clearNotificationsByRole,
  markAllAsRead,
} from '../../Controllers/Notification-controller/Notification-controller.js';

const router = express.Router();

// GET /api/notifications?role=bosmembers
router.get('/notifications', getNotificationsByRole);

// PUT /api/notifications/:id/read
router.put('/notifications/:id/read', markNotificationAsRead);

// PUT /api/notifications/mark-all-read?role=bosmembers
router.put('/notifications/mark-all-read', markAllAsRead);

// DELETE /api/notifications/clear?role=bosmembers
router.delete('/notifications/clear', clearNotificationsByRole);


export default router;


