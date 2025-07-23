import { Schema, model } from 'mongoose';

const recentDecisionSchema = new Schema({
  decision_id: {
    type: String,
    required: true,
    unique: true
  },
  decisionTitle: {
    type: String,
    required: true
  },
  decisionDetails: {
    type: String,
    required: true
  },
  decisionDate: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String,  // Assuming a simple user reference or a string for username
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  }
});

export default model('bos-RecentDecision', recentDecisionSchema);
