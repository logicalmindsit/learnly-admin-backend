import { Schema, model } from 'mongoose';

const meetingSchema = new Schema({
  meeting_id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  participants: [{
    type: String,
    validate: {
      validator: function (email) {
        // Basic regex for email format
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: props => `${props.value} is not a valid email address`
    }
  }],
  location: { type: String },
  agenda: { type: String },
  quorum: { type: Number }, // Number of required members present
  plateform_link: { type: String }, // Meeting link (e.g., Zoom, Google Meet)
  createdAt: { type: Date, default: Date.now }
});

const Meeting = model('bos-Meeting', meetingSchema);

export default Meeting;
