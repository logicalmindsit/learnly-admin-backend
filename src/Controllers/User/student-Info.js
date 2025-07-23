
// Data Maintenance Controller for Student Information
import mongoose from 'mongoose';
import User from '../../Models/User/User-Model.js';
import Payment from '../../Models/User-Model/Payment-Model/Payment-Model.js';
import EMIPlan from '../../Models/User-Model/Emi-Plan/Emi-Plan-Model.js';
import UserExamAnswer from '../../Models/User-Model/Exam-Model/User-Submit-Model.js';
import Course from "../../Models/Courses/coursemodel.js";

// Get a specific user's details
export const getUserDetails = async (req, res) => {
  console.log("🔍 getUserDetails - Controller started");
  try {
    const { id } = req.params; // Can be studentRegisterNumber or _id
    console.log("➡️ Fetching user by ID or Register Number:", id);

    const query = {};
    if (mongoose.isValidObjectId(id)) {
      query.$or = [{ _id: id }, { studentRegisterNumber: id }];
    } else {
      query.studentRegisterNumber = id;
    }

    const user = await User.findOne(query)
      .populate({
        path: "enrolledCourses.course",
        select: "coursename category courseduration price",
        model: Course,
      })
      .populate({
        path: "enrolledCourses.emiPlan",
        model: EMIPlan,
        select: "coursename totalAmount emiPeriod selectedDueDay status emis",
      })
      .lean();

    if (!user) {
      console.log("❌ User not found");
      return res.status(404).json({ message: "User not found" });
    }
    console.log("✅ User found:", user._id);

    const payments = await Payment.find({ userId: user._id })
      .select(
        "courseId courseName amount paymentStatus paymentMethod transactionId createdAt"
      )
      .populate({ path: "courseId", select: "coursename", model: Course })
      .lean();
    console.log("💰 Payments fetched:", payments.length);

    const examAttempts = await UserExamAnswer.find({ userId: user._id })
      .select(
        "courseId chapterTitle examId totalMarks obtainedMarks attemptedAt"
      )
      .populate({ path: "courseId", select: "coursename", model: Course })
      .populate({
        path: "examId",
        select: "examinationName subject totalMarks",
        model: "ExamQuestion",
      })
      .lean();
    console.log("📝 Exam attempts fetched:", examAttempts.length);

    const emiPlans = await EMIPlan.find({ userId: user._id })
      .select("coursename totalAmount emiPeriod selectedDueDay status emis")
      .populate({ path: "courseId", select: "coursename", model: Course })
      .lean();
    console.log("📅 EMI Plans fetched:", emiPlans.length);

    const userDetails = {
      userInfo: {
        studentRegisterNumber: user.studentRegisterNumber,
        email: user.email,
        mobile: user.mobile,
        username: user.username,
        role: user.role,
        fatherName: user.fatherName,
        dateofBirth: user.dateofBirth,
        gender: user.gender,
        address: user.address,
        bloodGroup: user.bloodGroup,
        Nationality: user.Nationality,
        Occupation: user.Occupation,
        profilePicture: user.profilePicture,
        status: user.status,
        lastActivity: user.lastActivity,
        lastLogout: user.lastLogout,
        loginHistory: user.loginHistory,
      },
      enrolledCourses: (user.enrolledCourses || []).map((course) => ({
        course: course.course,
        coursename: course.coursename,
        emiPlan: course.emiPlan,
        accessStatus: course.accessStatus,
      })),
      payments,
      examAttempts,
      emiPlans,
    };

    console.log("📦 Sending final userDetails response");
    res.status(200).json({
      message: "User details fetched successfully",
      data: userDetails,
    });
  } catch (error) {
    console.error("🔥 Error in getUserDetails:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all users' details
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate({
        path: "enrolledCourses.course",
        select: "coursename category courseduration price",
        model: Course,
      })
      .populate({
        path: "enrolledCourses.emiPlan",
        model: EMIPlan,
        select: "coursename totalAmount emiPeriod selectedDueDay status emis",
      })
      .lean();

    // Fetch related data for each user
    const userDetails = await Promise.all(
      users.map(async (user) => {
        const payments = await Payment.find({ userId: user._id })
          .select("courseId courseName amount paymentStatus paymentMethod transactionId createdAt")
          .populate({ path: "courseId", select: "coursename", model: Course })
          .lean();

        const examAttempts = await UserExamAnswer.find({ userId: user._id })
          .select("courseId chapterTitle examId totalMarks obtainedMarks attemptedAt")
          .populate({ path: "courseId", select: "coursename", model: Course })
          .populate({ path: "examId", select: "examinationName subject totalMarks", model: "ExamQuestion" })
          .lean();

        const emiPlans = await EMIPlan.find({ userId: user._id })
          .select("coursename totalAmount emiPeriod selectedDueDay status emis")
          .populate({ path: "courseId", select: "coursename", model: Course })
          .lean();

        return {
          userInfo: {
            studentRegisterNumber: user.studentRegisterNumber,
            email: user.email,
            mobile: user.mobile,
            username: user.username,
            role: user.role,
            fatherName: user.fatherName,
            dateofBirth: user.dateofBirth,
            gender: user.gender,
            address: user.address,
            bloodGroup: user.bloodGroup,
            Nationality: user.Nationality,
            Occupation: user.Occupation,
            profilePicture: user.profilePicture,
            status: user.status,
            lastActivity: user.lastActivity,
            lastLogout: user.lastLogout,
            loginHistory: user.loginHistory,
            },
          enrolledCourses: user.enrolledCourses.map((course) => ({
            course: course.course,
            coursename: course.coursename,
            emiPlan: course.emiPlan,
            accessStatus: course.accessStatus,
          })),
          payments,
          examAttempts,
          emiPlans,
        };
      })
    );

    res.status(200).json({ message: "All users' details fetched successfully", data: userDetails });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};