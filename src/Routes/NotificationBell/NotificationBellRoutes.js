import express from "express";
const router = express.Router();

import { createNotification } from "../../Controllers/Notificationbell/NotificationController.js";

router.post("/create", createNotification);

export default router;
