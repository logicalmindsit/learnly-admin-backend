import express from "express";
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventsByStatus
} from "../../Controllers/Event-Manage-Controller/event-manage-controller.js";

const router = express.Router();


router.post("/event/create", createEvent);
router.get("/event/list", getAllEvents);
router.get("/event/details/:eventId", getEventById);
router.get("/event/status/:status", getEventsByStatus);
router.put("/event/update/:eventId", updateEvent);
router.delete("/event/remove/:eventId", deleteEvent);

export default router;
