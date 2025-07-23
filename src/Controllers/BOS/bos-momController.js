import MoM from "../../Models/BOS/bos-MoM.js";

// Generate Minutes ID
const generateMinutesId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `MIN${timestamp}${random}`;
};

// Create new minutes of meeting
export const createMoM = async (req, res) => {
  try {
    const { meeting_id, decisions, notes, action_items, uploaded_by } = req.body;

    if (!meeting_id || !decisions || !uploaded_by) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    const minutes_id = generateMinutesId();

    const newMoM = new MoM({
      minutes_id,
      meeting_id,
      decisions,
      notes,
      action_items,
      uploaded_by,
    });

    await newMoM.save();

    res.status(201).json({
      success: true,
      message: "Minutes of meeting created successfully",
      data: newMoM,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating minutes of meeting",
      error: error.message,
    });
  }
};

// Get all minutes of meetings
export const getAllMoM = async (req, res) => {
  try {
    const minutes = await MoM.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: minutes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching minutes of meetings",
      error: error.message,
    });
  }
};

// Get single minutes of meeting by ID
export const getMoMById = async (req, res) => {
  try {
    const { id } = req.params;
    const minutes = await MoM.findOne({ minutes_id: id });
    
    if (!minutes) {
      return res.status(404).json({
        success: false,
        message: "Minutes of meeting not found",
      });
    }

    res.status(200).json({
      success: true,
      data: minutes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching minutes of meeting",
      error: error.message,
    });
  }
};

// Update minutes of meeting
export const updateMoM = async (req, res) => {
  try {
    const { id } = req.params;
    const { decisions, notes, action_items } = req.body;

    const minutes = await MoM.findOne({ minutes_id: id });
    
    if (!minutes) {
      return res.status(404).json({
        success: false,
        message: "Minutes of meeting not found",
      });
    }

    const updatedMoM = await MoM.findOneAndUpdate(
      { minutes_id: id },
      {
        decisions,
        notes,
        action_items,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Minutes of meeting updated successfully",
      data: updatedMoM,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating minutes of meeting",
      error: error.message,
    });
  }
};

// Delete minutes of meeting
export const deleteMoM = async (req, res) => {
  try {
    const { id } = req.params;
    const minutes = await MoM.findOne({ minutes_id: id });
    
    if (!minutes) {
      return res.status(404).json({
        success: false,
        message: "Minutes of meeting not found",
      });
    }

    await MoM.findOneAndDelete({ minutes_id: id });

    res.status(200).json({
      success: true,
      message: "Minutes of meeting deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting minutes of meeting",
      error: error.message,
    });
  }
};
