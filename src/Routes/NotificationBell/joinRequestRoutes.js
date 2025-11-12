// File: admin-backend/src/Routes/NotificationBell/joinRequestRoutes.js

import express from 'express';
const router = express.Router();

import { getAllJoinRequests, markAttendance, getUniqueCourseNames } from  '../../Controllers/Notificationbell/JoinRequestController.js';

// Admin mattum thaan paakanum-ngra security-a inga add panrom
// Unga admin middleware-oda sariyaana path and pera kudunga
import { verifyToken } from '../../Middleware/authMiddleware.js';
router.get('/courses', verifyToken, getUniqueCourseNames);
router.get('/', verifyToken, getAllJoinRequests); // route-la irundhum 'isAdmin'-a remove pannidunga
router.put('/:requestId/attendance', verifyToken, markAttendance);
export default router;