// File: admin-backend/src/Models/NotificationBell/JoinRequestModel.js

import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema({
  date: {
    type: String, 
    required: true,
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Not Marked'],
    required: true,
  },
}, {_id: false}); 

const joinRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  courseName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User', 
  },
  submittedAt: { type: Date, default: Date.now },
 attendanceRecords: [attendanceRecordSchema], 

});

const JoinRequest = mongoose.model('JoinRequest', joinRequestSchema);

export default JoinRequest;