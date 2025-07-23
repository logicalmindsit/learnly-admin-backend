import Meeting from '../../Models/BOS/bos-Meeting.js';
import Notification from '../../Notification/model.js'; 
import { sendMeetingEmail } from '../../Utils/Bos-notification.js';

export async function createMeeting(req, res) {
  try {
    const { title, date, time, participants } = req.body;

    // Validate required fields
    if (!title || !date || !time || !participants) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Generate meeting ID
    const currentYear = new Date().getFullYear();
    const latestMeeting = await Meeting.findOne({}, {}, { sort: { 'createdAt': -1 } });
    let nextMeetingNumber = 1;
    
    if (latestMeeting && latestMeeting.meeting_id) {
      const lastMeetingNumber = parseInt(latestMeeting.meeting_id.split('-M')[1]);
      nextMeetingNumber = lastMeetingNumber + 1;
    }

    const meeting_id = `BOS${currentYear}-M${nextMeetingNumber.toString().padStart(3, '0')}`;
    req.body.meeting_id = meeting_id;

    // Validate participants as email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of participants) {
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: `Invalid participant email: ${email}` });
      }
    }

    // Save meeting
    const meeting = new Meeting(req.body);
    await meeting.save();

    // Create a notification
    const notification = new Notification({
      title: 'New BOS Meeting Scheduled',
      message: `Meeting titled "${title}" is scheduled on ${new Date(date).toLocaleDateString()} at ${time}.`,
      recipientRoles: ['superadmin','bosmembers', 'boscontroller'],
       meetingId: meeting._id,
    });
    await notification.save();

    // Send email to all participants
    await sendMeetingEmail(participants, meeting);

    res.status(201).json({
      message: 'Meeting created successfully and emails sent to participants',
      data: meeting,
    });
  } catch (error) {
    res.status(400).json({
      message: 'Error creating meeting',
      error: error.message,
    });
  }
}

export const getMeetingById = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findById(id);
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    res.status(200).json({ message: 'Meeting fetched successfully', data: meeting });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching meeting', error: error.message });
  }
};