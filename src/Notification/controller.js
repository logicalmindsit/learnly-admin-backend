import Notification from './model.js';

// GET: Fetch notifications by role
export const getNotificationsByRole = async (req, res) => {
  try {
    const { role } = req.query;
    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }

    const notifications = await Notification.find({
      recipientRoles: role
    }).sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT: Mark a specific notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: 'Marked as read', data: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE: Clear all notifications for a role (optional admin use)
export const markAllAsRead = async (req, res) => {
  try {
    const { role } = req.query;
    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }

    const result = await Notification.updateMany(
      { recipientRoles: role, isRead: false },
      { isRead: true }
    );

    res.status(200).json({ 
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const clearNotificationsByRole = async (req, res) => {
  try {
    const { role } = req.query;

    const result = await Notification.deleteMany({ recipientRoles: role });

    res.status(200).json({ message: 'Notifications cleared', deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
