import JoinRequest from '../../Models/Notificationbell/JoinRequestModel.js';

// ✅ SentMaterial model-ayum marubadiyum import panrom
import SentMaterial from '../../Models/Notificationbell/SentMaterialModel.js';

export async function getAllJoinRequests(req, res) {
  try {
    const { courseName } = req.query;
    let filter = {};
    if (courseName) {
      filter.courseName = courseName;
    }

    let requests = await JoinRequest.find(filter)
      .populate('userId', 'name email')
      .sort({ submittedAt: -1 })
      .lean();

    // ================================================================
    // ✅ NAAMA MISS PANNA MATERIAL MERGE LOGIC-A MARUBADIYUM SERKROM ✅
    // ================================================================
    const materials = await SentMaterial.find({});
    const combinedData = requests.map(req => {
      const userMaterial = materials.find(
        mat => mat.userId.toString() === req.userId._id.toString() && mat.courseName === req.courseName
      );
      return { ...req, sentMaterial: userMaterial || null };
    });
    // ================================================================

    res.status(200).json(combinedData); // Combined data-va thaan anuppanum

  } catch (error) {
    console.error('Error fetching join requests:', error);
    res.status(500).json({ message: 'Failed to fetch join requests.' });
  }
}

export async function markAttendance(req, res) {
  try {
    const { requestId } = req.params;
    const { date, status } = req.body;

    if (!date || !status) {
      return res.status(400).json({ message: 'Date and status are required.' });
    }

    const request = await JoinRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Join request not found.' });
    }

    const existingRecord = request.attendanceRecords.find(record => record.date === date);

    if (existingRecord) {
      existingRecord.status = status;
    } else {
      request.attendanceRecords.push({ date, status });
    }

    await request.save();
    res.status(200).json({ message: 'Attendance updated successfully.', request });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Failed to mark attendance.' });
  }
}

export async function getUniqueCourseNames(req, res) {
  try {
    const courses = await JoinRequest.distinct('courseName');
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch course names.' });
  }
}

