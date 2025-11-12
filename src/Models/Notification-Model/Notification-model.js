import { Schema, model } from 'mongoose';

const notificationSchema = new Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  recipientRoles: [{ type: String }], // e.g. ['bosmembers']
  isRead: { type: Boolean, default: false },
    meetingId: {
    type: Schema.Types.ObjectId,
    ref: 'Meeting', 
    default: null,
  },
  createdAt: { type: Date, default: Date.now }
});

export default model('Notification', notificationSchema);
