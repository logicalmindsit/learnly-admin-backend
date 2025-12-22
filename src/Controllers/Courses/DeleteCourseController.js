import Course from "../../Models/Courses/coursemodel.js";
import ExamQuestion from "../../Models/Courses/QuestionModel.js";
import { DeleteObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import s3 from "../../DB/adudios3.js";
import dotenv from "dotenv";
import { URL } from "url";

dotenv.config();

// Delete single file from S3
const deleteFromS3 = async (fileUrl) => {
  try {
    if (!fileUrl) return false;
    
    const parsedUrl = new URL(fileUrl);
    const Key = parsedUrl.pathname.substring(1); // Remove leading slash

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_SCHOOLEMY,
      Key,
    });

    await s3.send(command);
    return true;
  } catch (error) {
    return false;
  }
};

// Delete entire folder from S3 (more efficient for bulk deletion)
const deleteFolderFromS3 = async (folderPrefix) => {
  try {
    if (!folderPrefix) return false;

    const allObjects = [];
    let continuationToken = null;

    // List all objects in the folder
    do {
      const listCommand = new ListObjectsV2Command({
        Bucket: process.env.AWS_S3_BUCKET_SCHOOLEMY,
        Prefix: folderPrefix,
        ContinuationToken: continuationToken,
      });

      const response = await s3.send(listCommand);
      
      if (response.Contents && response.Contents.length > 0) {
        allObjects.push(
          ...response.Contents.map((obj) => ({ Key: obj.Key }))
        );
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    if (allObjects.length === 0) {
      return true;
    }

    // Delete objects in batches of 1000 (S3 limit)
    const batchSize = 1000;
    for (let i = 0; i < allObjects.length; i += batchSize) {
      const batch = allObjects.slice(i, i + batchSize);
      
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: process.env.AWS_S3_BUCKET_SCHOOLEMY,
        Delete: {
          Objects: batch,
          Quiet: true,
        },
      });

      await s3.send(deleteCommand);
    }

    return true;
  } catch (error) {
    return false;
  }
};

// Delete Course Controller
export const deleteCourse = async (req, res) => {
  try {
    const { coursename } = req.params;

    if (!coursename) {
      return res.status(400).json({
        success: false,
        error: "coursename is required",
      });
    }

    // Find the course
    const course = await Course.findOne({ coursename });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found",
      });
    }

    // Step 1: Delete all question papers for this course
    const deleteQuestionPapersResult = await ExamQuestion.deleteMany({ coursename });

    // Step 2: Delete all S3 files associated with the course
    const deletePromises = [];

    // Delete thumbnail if exists
    if (course.thumbnail) {
      deletePromises.push(deleteFromS3(course.thumbnail));
    }

    // Delete preview video if exists
    if (course.previewvedio) {
      deletePromises.push(deleteFromS3(course.previewvedio));
    }

    // Delete all lesson files (audio, video, pdf) from chapters
    course.chapters.forEach((chapter) => {
      chapter.lessons.forEach((lesson) => {
        if (lesson.audioFile && Array.isArray(lesson.audioFile)) {
          lesson.audioFile.forEach((file) => {
            if (file.url) {
              deletePromises.push(deleteFromS3(file.url));
            }
          });
        }
        if (lesson.videoFile && Array.isArray(lesson.videoFile)) {
          lesson.videoFile.forEach((file) => {
            if (file.url) {
              deletePromises.push(deleteFromS3(file.url));
            }
          });
        }
        if (lesson.pdfFile && Array.isArray(lesson.pdfFile)) {
          lesson.pdfFile.forEach((file) => {
            if (file.url) {
              deletePromises.push(deleteFromS3(file.url));
            }
          });
        }
      });
    });

    // Wait for all S3 deletions to complete
    const s3DeleteResults = await Promise.allSettled(deletePromises);
    
    const s3SuccessCount = s3DeleteResults.filter(
      (result) => result.status === "fulfilled" && result.value === true
    ).length;
    const s3FailureCount = s3DeleteResults.length - s3SuccessCount;

    // Step 3: Delete the entire course folder from S3 (if it exists)
    const courseFolder = coursename.toLowerCase().replace(/\s+/g, "-");
    await deleteFolderFromS3(courseFolder);

    // Step 4: Delete the course from database
    await Course.findByIdAndDelete(course._id);

    res.status(200).json({
      success: true,
      message: "Course and all associated data deleted successfully",
      details: {
        courseDeleted: true,
        questionPapersDeleted: deleteQuestionPapersResult.deletedCount,
        s3FilesDeleted: s3SuccessCount,
        s3FilesFailed: s3FailureCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

