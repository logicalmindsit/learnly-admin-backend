import UserAttempt from "../../Models/Courses/UserExamAnswer.js";
import mongoose from "mongoose";

// Get all exam attempts for a specific user
export const getUserExamAttempts = async (req, res) => {
  try {
    const { userId } = req.params;

    const attempts = await UserAttempt.find({ userId })
      .populate('courseId', 'courseName')
      .populate('examId', 'title')
      .sort({ attemptedAt: -1 });

    res.status(200).json({
      success: true,
      message: "User exam attempts retrieved successfully",
      data: attempts
    });
  } catch (error) {
    console.error("Error fetching user exam attempts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user exam attempts",
      error: error.message
    });
  }
};

// Get exam attempts for a specific course
export const getCourseExamAttempts = async (req, res) => {
  try {
    const { courseId } = req.params;

    const attempts = await UserAttempt.find({ courseId })
      .populate('userId', 'name email')
      .populate('examId', 'title')
      .sort({ attemptedAt: -1 });

    res.status(200).json({
      success: true,
      message: "Course exam attempts retrieved successfully",
      data: attempts
    });
  } catch (error) {
    console.error("Error fetching course exam attempts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch course exam attempts",
      error: error.message
    });
  }
};

// Get exam attempts for a specific exam
export const getExamAttempts = async (req, res) => {
  try {
    const { examId } = req.params;

    const attempts = await UserAttempt.find({ examId })
      .populate('userId', 'name email')
      .populate('courseId', 'courseName')
      .sort({ attemptedAt: -1 });

    res.status(200).json({
      success: true,
      message: "Exam attempts retrieved successfully",
      data: attempts
    });
  } catch (error) {
    console.error("Error fetching exam attempts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch exam attempts",
      error: error.message
    });
  }
};

// Get specific exam attempt by ID
export const getExamAttemptById = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await UserAttempt.findById(attemptId)
      .populate('userId', 'name email')
      .populate('courseId', 'courseName')
      .populate('examId', 'title');

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Exam attempt not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Exam attempt retrieved successfully",
      data: attempt
    });
  } catch (error) {
    console.error("Error fetching exam attempt:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch exam attempt",
      error: error.message
    });
  }
};

// Get exam attempts by chapter
export const getChapterExamAttempts = async (req, res) => {
  try {
    const { chapterTitle, courseId } = req.params;

    const attempts = await UserAttempt.find({ 
      chapterTitle, 
      courseId 
    })
      .populate('userId', 'name email')
      .populate('examId', 'title')
      .sort({ attemptedAt: -1 });

    res.status(200).json({
      success: true,
      message: "Chapter exam attempts retrieved successfully",
      data: attempts
    });
  } catch (error) {
    console.error("Error fetching chapter exam attempts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chapter exam attempts",
      error: error.message
    });
  }
};

// Get user's exam statistics
export const getUserExamStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const stats = await UserAttempt.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          totalMarks: { $sum: "$totalMarks" },
          totalObtainedMarks: { $sum: "$obtainedMarks" },
          averageScore: { $avg: { $divide: ["$obtainedMarks", "$totalMarks"] } }
        }
      }
    ]);

    const courseStats = await UserAttempt.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$courseId",
          attempts: { $sum: 1 },
          totalMarks: { $sum: "$totalMarks" },
          obtainedMarks: { $sum: "$obtainedMarks" },
          averageScore: { $avg: { $divide: ["$obtainedMarks", "$totalMarks"] } }
        }
      },
      {
        $lookup: {
          from: "courses",
          localField: "_id",
          foreignField: "_id",
          as: "course"
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: "User exam statistics retrieved successfully",
      data: {
        overall: stats[0] || {
          totalAttempts: 0,
          totalMarks: 0,
          totalObtainedMarks: 0,
          averageScore: 0
        },
        courseWise: courseStats
      }
    });
  } catch (error) {
    console.error("Error fetching user exam stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user exam statistics",
      error: error.message
    });
  }
};

// Delete exam attempt (if needed for admin purposes)
export const deleteExamAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const deletedAttempt = await UserAttempt.findByIdAndDelete(attemptId);

    if (!deletedAttempt) {
      return res.status(404).json({
        success: false,
        message: "Exam attempt not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Exam attempt deleted successfully",
      data: deletedAttempt
    });
  } catch (error) {
    console.error("Error deleting exam attempt:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete exam attempt",
      error: error.message
    });
  }
};

// Get all exam attempts (for admin)
export const getAllExamAttempts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const attempts = await UserAttempt.find()
      .populate('userId', 'name email')
      .populate('courseId', 'courseName')
      .populate('examId', 'title')
      .sort({ attemptedAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalAttempts = await UserAttempt.countDocuments();

    res.status(200).json({
      success: true,
      message: "All exam attempts retrieved successfully",
      data: {
        attempts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalAttempts / limit),
          totalAttempts,
          hasNext: page < Math.ceil(totalAttempts / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error("Error fetching all exam attempts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch all exam attempts",
      error: error.message
    });
  }
};
