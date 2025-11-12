import ExamQuestion from "../../Models/Courses/QuestionModel.js";
import mongoose from "mongoose";

// CREATE
export const createExamQuestion = async (req, res) => {
  try {
    const {
      coursename,
      chapterTitle,
      examinationName,
      subject,
      totalMarks,
      examQuestions,
    } = req.body;

    const requiredFields = {
      coursename,
      chapterTitle,
      examinationName,
      subject,
      totalMarks,
      examQuestions,
    };
    const missingFields = Object.entries(requiredFields)
      .filter(
        ([key, value]) => value === undefined || value === null || value === ""
      )
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const newExam = new ExamQuestion({
      coursename,
      chapterTitle,
      examinationName,
      subject,
      totalMarks,
      examQuestions,
    });

    await newExam.save();
    res
      .status(201)
      .json({ message: "Exam created successfully", exam: newExam });
  } catch (error) {
    console.error("Error creating exam:", error);
    res
      .status(500)
      .json({ message: "Failed to create exam", error: error.message });
  }
};


// GET - Fetch exams by coursename and chapterTitle
export const getExamQuestionsByCourseAndChapter = async (req, res) => {
  try {
    const { coursename, chapterTitle } = req.query;

    if (!coursename || !chapterTitle) {
      return res.status(400).json({
        success: false,
        message: "Both 'coursename' and 'chapterTitle' are required in query.",
      });
    }

    const exams = await ExamQuestion.find({
      coursename,
      chapterTitle,
    });

    if (!exams || exams.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No exams found for the given course and chapter.",
      });
    }

    res.status(200).json({ success: true, exams });
  } catch (error) {
    console.error("Error fetching exams:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch exams",
      error: error.message,
    });
  }
};

// UPDATE
export const updateExam = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID format",
      });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Update failed: No data provided in the request body.",
      });
    }

    const updatedExam = await ExamQuestion.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedExam) {
      return res.status(404).json({
        success: false,
        message: "Update failed: Exam not found with the given ID.",
      });
    }

    return res
      .status(200)
      .json({
        success: true,
        message: "Exam updated successfully",
        exam: updatedExam,
      });
  } catch (error) {
    console.error("Error updating exam:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Server error while updating exam",
        error: error.message,
      });
  }
};

// DELETE
export const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID format. Please provide a valid ID.",
      });
    }

    const deletedExam = await ExamQuestion.findByIdAndDelete(id);

    if (!deletedExam) {
      return res.status(404).json({
        success: false,
        message: "Delete failed: No exam found with the provided ID.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Exam deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error occurred while deleting the exam",
      error: error.message,
    });
  }
};
