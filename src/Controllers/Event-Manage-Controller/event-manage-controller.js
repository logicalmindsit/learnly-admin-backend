import EventManageModel from "../../Models/Event-Manage-Model/event-manage-model.js";

// Helper: Convert base64 → buffer
const parseBase64Images = (images) => {
  if (!images || !Array.isArray(images)) return [];
  return images
    .map((img) => {
      if (typeof img !== "string") return null;
      const matches = img.match(/^data:(.+);base64,(.+)$/);
      if (!matches) return null;
      return {
        data: Buffer.from(matches[2], "base64"),
        contentType: matches[1]
      };
    })
    .filter(Boolean);
};

// ✅ Create Event
export const createEvent = async (req, res) => {
  try {
    const { coverImages, ...rest } = req.body;
    const newEvent = new EventManageModel({
      ...rest,
      coverImages: parseBase64Images(coverImages)
    });

    await newEvent.save();
    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: newEvent
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ Get All Events with Pagination
export const getAllEvents = async (req, res) => {
  try {
    // Parse pagination query params (default page=1, limit=10)
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    // Optional filters (you can extend later)
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;

    // Fetch paginated events
    const [events, total] = await Promise.all([
      EventManageModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      EventManageModel.countDocuments(filter)
    ]);

    // Handle empty case
    if (!events || events.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Empty - No events found",
        data: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0
        }
      });
    }

    // ✅ Response with pagination info
    res.status(200).json({
      success: true,
      message: "Events retrieved successfully",
      count: events.length,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      data: events
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Single Event by eventId
export const getEventById = async (req, res) => {
  try {
    const event = await EventManageModel.findOne({ eventId: req.params.eventId });
    if (!event)
      return res.status(404).json({ success: false, message: "Event not found" });
    res.status(200).json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Events by Status (Upcoming / Ongoing / Completed)
export const getEventsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ["Upcoming", "Ongoing", "Completed"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Use one of: ${validStatuses.join(", ")}`
      });
    }

    const events = await EventManageModel.find({ status }).sort({ date: 1 });

    if (!events || events.length === 0) {
      return res.status(200).json({
        success: true,
        message: `No ${status.toLowerCase()} events found`,
        data: []
      });
    }

    res.status(200).json({
      success: true,
      message: `${status} events retrieved successfully`,
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};




export const updateEvent = async (req, res) => {
  try {
    const { coverImages, ...rest } = req.body;
    const updateData = { ...rest };
    if (coverImages) updateData.coverImages = parseBase64Images(coverImages);

    const updated = await EventManageModel.findOneAndUpdate(
      { eventId: req.params.eventId },
      updateData,
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ success: false, message: "Event not found" });

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: updated
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ Delete Event
export const deleteEvent = async (req, res) => {
  try {
    const deleted = await EventManageModel.findOneAndDelete({
      eventId: req.params.eventId
    });
    if (!deleted)
      return res.status(404).json({ success: false, message: "Event not found" });

    res.status(200).json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
