import mongoose from 'mongoose';

const notificationBellSchema = new mongoose.Schema({
  message: {
    type: String,
    required: [true, 'Notification message cannot be empty'],
    trim: true,
  },
  courseName: {
    type: String,
    required: [true, 'Course name is required.'],
    trim: true,
  },
  joinLink: {
    type: String,
    trim: true,
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Model create panni atha apdiye export panrom
const NotificationBell = mongoose.model('NotificationBell', notificationBellSchema);

export default NotificationBell; 