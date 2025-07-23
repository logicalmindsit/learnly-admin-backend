import ExamMarkRecords from '../../Models/Data-Maintenance/exam-mark-records-model.js';


// Create new student exam record
export const createStudentNewExamRecords = async (req, res) => {
  try {
    const { studentName, studentId, grade, percentage, mark, status } = req.body;

    if (!studentName || !studentId || !grade || percentage == null || mark == null || !status) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: studentName, studentId, grade, percentage, mark, status.',
      });
    }

    const newRecord = await ExamMarkRecords.create({
      studentName,
      studentId,
      grade,
      percentage,
      mark,
      status,
    });

    res.status(201).json({
      success: true,
      message: 'Exam record created successfully.',
      data: newRecord,
    });
  } catch (error) {
    console.error('Error in createStudentNewExamRecords:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while creating the exam record.',
      details: error.message,
    });
  }
};

// Update existing student exam record
export const updateStudentExamRecords = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Record ID is required.',
      });
    }

    const updatedRecord = await ExamMarkRecords.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedRecord) {
      return res.status(404).json({
        success: false,
        message: 'Exam record not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Exam record updated successfully.',
      data: updatedRecord,
    });
  } catch (error) {
    console.error('Error in updateStudentExamRecords:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating the exam record.',
      details: error.message,
    });
  }
};

// Get all student exam marks (with pagination, filtering, sorting)
export const getAllStudentExamMarks = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.studentId) filter.studentId = req.query.studentId.trim();
    if (req.query.grade) filter.grade = req.query.grade;
    if (req.query.status) filter.status = req.query.status;

    const sort = {};
    if (req.query.sortBy) {
      const [key, order] = req.query.sortBy.split(':');
      sort[key] = order === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    const [records, total] = await Promise.all([
      ExamMarkRecords.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      ExamMarkRecords.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: records.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: records,
    });
  } catch (error) {
    console.error('Error in getAllStudentExamMarks:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching exam marks.',
      details: error.message,
    });
  }
};

// Download student exam records (basic version - you can customize further)
export const downloadStudentExamRecords = async (req, res) => {
  try {
    const records = await ExamMarkRecords.find({}).lean();

    if (!records.length) {
      return res.status(404).json({
        success: false,
        message: 'No exam records found to download.',
      });
    }

    res.setHeader('Content-Disposition', 'attachment; filename="exam_records.json"');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(JSON.stringify(records, null, 2));
  } catch (error) {
    console.error('Error in downloadStudentExamRecords:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while downloading exam records.',
      details: error.message,
    });
  }
};

// Get overall exam statistics
export const getStudentExamStatistics = async (req, res) => {
  try {
    const statistics = await ExamMarkRecords.aggregate([
      {
        $group: {
          _id: '$grade',
          count: { $sum: 1 },
          avgPercentage: { $avg: '$percentage' },
          avgMark: { $avg: '$mark' },
          passCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Pass'] }, 1, 0],
            },
          },
        },
      },
    ]);

    if (!statistics.length) {
      return res.status(404).json({
        success: false,
        message: 'No exam statistics available.',
      });
    }

    // Calculate global statistics
    const totalStudents = statistics.reduce((sum, item) => sum + item.count, 0);
    const averagePercentage = (
      statistics.reduce((sum, item) => sum + item.avgPercentage * item.count, 0) / totalStudents
    ).toFixed(2);
    const averageMark = (
      statistics.reduce((sum, item) => sum + item.avgMark * item.count, 0) / totalStudents
    ).toFixed(2);
    const passRate = (
      (statistics.reduce((sum, item) => sum + item.passCount, 0) / totalStudents) *
      100
    ).toFixed(2);

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        averagePercentage,
        averageMark,
        passRate,
        gradeDistribution: statistics.map((item) => ({
          grade: item._id,
          count: item.count,
        })),
      },
    });
  } catch (error) {
    console.error('Error in getStudentExamStatistics:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching exam statistics.',
      details: error.message,
    });
  }
};