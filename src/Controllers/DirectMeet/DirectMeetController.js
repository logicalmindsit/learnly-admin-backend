import DirectMeet from '../../Models/DirectMeet/DirectMeetModel.js';
import { sendDirectMeetNotificationToAllUsers } from '../../Utils/DirectMeetNotification.js';

// Helper function to generate unique meet_id
const generateMeetId = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  // Get count of meets created this month
  const startOfMonth = new Date(year, now.getMonth(), 1);
  const endOfMonth = new Date(year, now.getMonth() + 1, 0);
  
  const monthlyCount = await DirectMeet.countDocuments({
    createdAt: {
      $gte: startOfMonth,
      $lt: endOfMonth
    }
  });
  
  const sequence = String(monthlyCount + 1).padStart(3, '0');
  return `DM${year}${month}${sequence}`;
};

// Create DirectMeet
export const createDirectMeet = async (req, res) => {
  try {
    const { 
      meet_title, 
      description, 
      apply_meet_start_date, 
      apply_meet_end_date, 
      meet_conduct_from_date, 
      meet_completed_date, 
      fees 
    } = req.body;

    // Validate required fields
    if (!meet_title || !description || !apply_meet_start_date || !apply_meet_end_date || !meet_conduct_from_date || fees === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'meet_title, description, apply_meet_start_date, apply_meet_end_date, meet_conduct_from_date, and fees are required' 
      });
    }

    // Validate fees (must be a positive number)
    if (typeof fees !== 'number' || fees < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Fees must be a non-negative number' 
      });
    }

    // Generate unique meet_id
    let meet_id = await generateMeetId();
    
    // Ensure uniqueness (in case of race conditions)
    let attempts = 0;
    while (await DirectMeet.findOne({ meet_id }) && attempts < 10) {
      attempts++;
      meet_id = await generateMeetId() + String.fromCharCode(65 + attempts); // Add A, B, C... suffix
    }
    
    if (attempts >= 10) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to generate unique meet ID. Please try again.' 
      });
    }

    // Validate dates
    const startDate = new Date(apply_meet_start_date);
    const endDate = new Date(apply_meet_end_date);
    const conductDate = new Date(meet_conduct_from_date);

    if (endDate <= startDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Apply meet end date must be after start date' 
      });
    }

    if (conductDate < endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Meet conduct date should be after or equal to application end date' 
      });
    }

    // Create a new DirectMeet
    const directMeet = new DirectMeet({
      meet_id,
      meet_title,
      description,
      apply_meet_start_date,
      apply_meet_end_date,
      meet_conduct_from_date,
      meet_completed_date,
      fees
    });

    await directMeet.save();

    // Send notification emails to all users
    try {
      console.log(`Sending DirectMeet notification for: ${directMeet.meet_title}`);
      const notificationResult = await sendDirectMeetNotificationToAllUsers(directMeet);
      
      if (notificationResult.success) {
        console.log(`✅ DirectMeet notifications sent successfully: ${notificationResult.successCount}/${notificationResult.totalUsers} users notified`);
      } else {
        console.error(`❌ Failed to send DirectMeet notifications: ${notificationResult.message}`);
      }
    } catch (notificationError) {
      // Don't fail the DirectMeet creation if notification fails
      console.error("Error sending DirectMeet notifications:", notificationError);
    }

    res.status(201).json({ 
      success: true, 
      message: 'DirectMeet created successfully', 
      directMeet 
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation Error', 
        error: error.message 
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Meet ID already exists' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Error creating DirectMeet', 
      error: error.message 
    });
  }
};

// Get All DirectMeets with Pagination and Filtering
export const getAllDirectMeets = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      is_active, 
      search,
      sort_by = 'createdAt',
      sort_order = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (is_active !== undefined) {
      filter.is_active = is_active === 'true';
    }

    // Add search functionality
    if (search) {
      filter.$or = [
        { meet_id: { $regex: search, $options: 'i' } },
        { meet_title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortObject = {};
    sortObject[sort_by] = sort_order === 'asc' ? 1 : -1;

    const directMeets = await DirectMeet.find(filter)
      .sort(sortObject)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalRecords = await DirectMeet.countDocuments(filter);

    res.status(200).json({ 
      success: true, 
      directMeets, 
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: Number(page),
      hasNextPage: page < Math.ceil(totalRecords / limit),
      hasPrevPage: page > 1
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching DirectMeets', 
      error: error.message 
    });
  }
};

// Get DirectMeet by ID
export const getDirectMeetById = async (req, res) => {
  try {
    const directMeet = await DirectMeet.findById(req.params.id);
    
    if (!directMeet) {
      return res.status(404).json({ 
        success: false, 
        message: 'DirectMeet not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      directMeet 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching DirectMeet', 
      error: error.message 
    });
  }
};

// Get DirectMeet by meet_id
export const getDirectMeetByMeetId = async (req, res) => {
  try {
    const directMeet = await DirectMeet.findOne({ meet_id: req.params.meet_id });
    
    if (!directMeet) {
      return res.status(404).json({ 
        success: false, 
        message: 'DirectMeet not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      directMeet 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching DirectMeet', 
      error: error.message 
    });
  }
};

// Update DirectMeet
export const updateDirectMeet = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If updating dates, validate them
    if (updateData.apply_meet_start_date && updateData.apply_meet_end_date) {
      const startDate = new Date(updateData.apply_meet_start_date);
      const endDate = new Date(updateData.apply_meet_end_date);
      
      if (endDate <= startDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'Apply meet end date must be after start date' 
        });
      }
    }

    // If updating fees, validate it
    if (updateData.fees !== undefined && (typeof updateData.fees !== 'number' || updateData.fees < 0)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Fees must be a non-negative number' 
      });
    }

    const updatedDirectMeet = await DirectMeet.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!updatedDirectMeet) {
      return res.status(404).json({ 
        success: false, 
        message: 'DirectMeet not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'DirectMeet updated successfully', 
      directMeet: updatedDirectMeet 
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation Error', 
        error: error.message 
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Meet ID already exists' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Error updating DirectMeet', 
      error: error.message 
    });
  }
};

// Delete DirectMeet
export const deleteDirectMeet = async (req, res) => {
  try {
    const deletedDirectMeet = await DirectMeet.findByIdAndDelete(req.params.id);
    
    if (!deletedDirectMeet) {
      return res.status(404).json({ 
        success: false, 
        message: 'DirectMeet not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'DirectMeet deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting DirectMeet', 
      error: error.message 
    });
  }
};

// Soft Delete DirectMeet (set is_active to false)
export const softDeleteDirectMeet = async (req, res) => {
  try {
    const updatedDirectMeet = await DirectMeet.findByIdAndUpdate(
      req.params.id,
      { is_active: false },
      { new: true }
    );

    if (!updatedDirectMeet) {
      return res.status(404).json({ 
        success: false, 
        message: 'DirectMeet not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'DirectMeet deactivated successfully', 
      directMeet: updatedDirectMeet 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error deactivating DirectMeet', 
      error: error.message 
    });
  }
};

// Get Active DirectMeets (where applications are open)
export const getActiveDirectMeets = async (req, res) => {
  try {
    const now = new Date();
    
    const activeDirectMeets = await DirectMeet.find({
      is_active: true,
      apply_meet_start_date: { $lte: now },
      apply_meet_end_date: { $gte: now }
    }).sort({ apply_meet_end_date: 1 });

    res.status(200).json({ 
      success: true, 
      activeDirectMeets,
      count: activeDirectMeets.length 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching active DirectMeets', 
      error: error.message 
    });
  }
};

// Get Upcoming DirectMeets
export const getUpcomingDirectMeets = async (req, res) => {
  try {
    const now = new Date();
    
    const upcomingDirectMeets = await DirectMeet.find({
      is_active: true,
      apply_meet_start_date: { $gt: now }
    }).sort({ apply_meet_start_date: 1 });

    res.status(200).json({ 
      success: true, 
      upcomingDirectMeets,
      count: upcomingDirectMeets.length 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching upcoming DirectMeets', 
      error: error.message 
    });
  }
};

// Mark DirectMeet as Completed
export const markDirectMeetCompleted = async (req, res) => {
  try {
    const { id } = req.params;
    const { meet_completed_date } = req.body;
    
    const completedDate = meet_completed_date ? new Date(meet_completed_date) : new Date();
    
    const updatedDirectMeet = await DirectMeet.findByIdAndUpdate(
      id,
      { 
        meet_completed_date: completedDate,
        status: 'completed'
      },
      { new: true, runValidators: true }
    );

    if (!updatedDirectMeet) {
      return res.status(404).json({ 
        success: false, 
        message: 'DirectMeet not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'DirectMeet marked as completed successfully', 
      directMeet: updatedDirectMeet 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error marking DirectMeet as completed', 
      error: error.message 
    });
  }
};

// Get DirectMeet Statistics
export const getDirectMeetStats = async (req, res) => {
  try {
    const totalMeets = await DirectMeet.countDocuments({ is_active: true });
    const completedMeets = await DirectMeet.countDocuments({ status: 'completed', is_active: true });
    const ongoingMeets = await DirectMeet.countDocuments({ status: 'ongoing', is_active: true });
    const upcomingMeets = await DirectMeet.countDocuments({ status: 'upcoming', is_active: true });
    
    const now = new Date();
    const activeApplications = await DirectMeet.countDocuments({
      is_active: true,
      apply_meet_start_date: { $lte: now },
      apply_meet_end_date: { $gte: now }
    });

    res.status(200).json({
      success: true,
      stats: {
        totalMeets,
        completedMeets,
        ongoingMeets,
        upcomingMeets,
        activeApplications
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching DirectMeet statistics', 
      error: error.message 
    });
  }
};

// Send DirectMeet Notification to All Users (Manual trigger)
export const sendDirectMeetNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const directMeet = await DirectMeet.findById(id);
    if (!directMeet) {
      return res.status(404).json({ 
        success: false, 
        message: 'DirectMeet not found' 
      });
    }

    console.log(`Manual notification trigger for DirectMeet: ${directMeet.meet_title}`);
    const notificationResult = await sendDirectMeetNotificationToAllUsers(directMeet);

    if (notificationResult.success) {
      res.status(200).json({
        success: true,
        message: 'DirectMeet notifications sent successfully',
        data: {
          meetTitle: directMeet.meet_title,
          totalUsers: notificationResult.totalUsers,
          successCount: notificationResult.successCount,
          failureCount: notificationResult.failureCount,
          failures: notificationResult.failures
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send DirectMeet notifications',
        error: notificationResult.message
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error sending DirectMeet notification', 
      error: error.message 
    });
  }
};
