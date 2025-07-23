import express from "express";
import {
  getAdminSummary,
  getRecentActivities,
  getActionStats,
  getLoginHistory
} from "../../Controllers/Admin/adminAnalyticsController.js";

const router = express.Router();

router.get("/summary", getAdminSummary); 
router.get("/recent-activities", getRecentActivities); 
router.get("/action-stats", getActionStats); 
router.get("/login-history", getLoginHistory);
export default router;
