import NotificationBell from '../../Models/Notificationbell/NotificationModel.js';

/**
 * @desc    Create a new bell notification
 * @route   POST /api/bell-notifications/create
 * @access  Private (Admin Only)
 */
// ✅ Notification-a create panra function. Idhu inga thaan irukkanum.
export async function createNotification(req, res) {
  try {
    const { title, message, courseName, buttonName, joinLink } = req.body;

    // Validation: Message खाली-या irukka koodathu
    if (!message || message.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Notification message cannot be empty.' 
      });
    }

    // Puthu notification-a database-la create panrom
     const newNotification = await NotificationBell.create({
      title, message, courseName, buttonName, joinLink,
    });
    // Success message anuppurom
    res.status(201).json({ 
      success: true, 
      message: 'Notification created successfully.',
      data: newNotification 
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while creating notification.',
      error: error.message 
    });
  }
}
