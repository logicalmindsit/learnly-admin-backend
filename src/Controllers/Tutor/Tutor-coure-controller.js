
import Course from "../../Models/Tutor/Tutor-CourseModel.js";
import Tutor from "../../Models/Tutor/TutorModel.js";

import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../../DB/adudios3.js";
import dotenv from "dotenv";
import path from "path";
import { URL } from "url";
import mongoose from "mongoose";

dotenv.config();

// Upload file to S3
const uploadToS3 = async (file, folder, rawName = null) => {
  const ext = path.extname(file.originalname);
  const baseName =
    typeof rawName === "string"
      ? rawName
      : path.basename(file.originalname, ext);

  const safeName = baseName.trim();
  const filename = `${safeName}${ext}`;
  const Key = `${folder}/${filename}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_TUTOR,
    Key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  try {
    await s3.send(command);
    return {
      name: filename,
      url: `https://${process.env.AWS_S3_BUCKET_TUTOR}.s3.${process.env.AWS_REGION}.amazonaws.com/${Key}`,
    };
  } catch (error) {
    console.error("❌ S3 upload error:", error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

const generateCourseMotherId = (coursename, courseduration) => {
  // Sanitize & create abbreviation
  const nameAbbreviation = coursename
    .split(/\s+/)
    .map((word) => word[0]) // Take first letter of each word
    .join("")
    .toUpperCase()
    .substring(0, 10); // Optional: limit max length

  const durationMap = {
    "6 months": "6M",
    "1 year": "1Y",
    "2 years": "2Y",
  };

  const durationCode = durationMap[courseduration] || "XX";
  const id = `${nameAbbreviation}-${durationCode}`;
  return id;
};

// Create Course
export const createCourse = async (req, res) => {
  try {
    const {
      coursename,
      category,
      courseduration,
      CourseMotherId,
      useAutoCourseMotherId,
      tutorObjectId, // Changed from tutorId to tutorObjectId
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(tutorObjectId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid tutor ID format"
      });
    }

    // Find tutor by ObjectId
    const tutor = await Tutor.findById(tutorObjectId);

    if (!tutor) {
      console.log("❌ No tutor found with ObjectId:", tutorObjectId);
      return res.status(404).json({
        success: false,
        error: "Tutor not found"
      });
    }
    
    // Auto-generate CourseMotherId if useAutoCourseMotherId is true or CourseMotherId is not provided
    let finalCourseMotherId = CourseMotherId;
    if (useAutoCourseMotherId === "true" || !CourseMotherId) {
      finalCourseMotherId = generateCourseMotherId(coursename, courseduration);
    }

    if (!coursename || !category || !courseduration) {
      return res.status(400).json({
        error: "coursename, category, and courseduration are required",
      });
    }

    const existing = await Course.findOne({ coursename });
    if (existing)
      return res.status(400).json({ error: "Course already exists" });

    const courseFolder = coursename.toLowerCase().replace(/\s+/g, "-");
    const files = req.files || [];

    const fileMap = {};

    // 🔁 Upload each file and categorize
    for (const file of files) {
      const field = file.fieldname;
      let folder = "misc";

      if (field.includes("previewvideo")) folder = "preview";
      else if (field.includes("thumbnail")) folder = "thumbnail";
      else if (field.includes("audio")) folder = "audio";
      else if (field.includes("video")) folder = "video";
      else if (field.includes("pdf")) folder = "pdf";

      // 🔍 Extract raw name from body
      let rawName = null;
      const match = field.match(
        /chapters\[(\d+)\]\.lessons\[(\d+)\]\.(audio|video|pdf)/
      );
      if (match) {
        const [_, chIdx, lsnIdx, type] = match;
        const key = `chapters[${chIdx}].lessons[${lsnIdx}].${type}name`;
        const val = req.body[key];
        if (Array.isArray(val)) rawName = val[fileMap[field]?.length || 0];
        else rawName = val;
      }

      const { name, url } = await uploadToS3(
        file,
        `${courseFolder}/${folder}`,
        rawName
      );

      if (!fileMap[field]) fileMap[field] = [];
      fileMap[field].push({ name, url });
    }

    // 📚 Build chapters & lessons
    const chapters = [];
    let chapterIndex = 0;

    while (req.body[`chapters[${chapterIndex}].title`]) {
      const title = req.body[`chapters[${chapterIndex}].title`];
      const lessons = [];

      let lessonIndex = 0;
      while (
        req.body[`chapters[${chapterIndex}].lessons[${lessonIndex}].lessonname`]
      ) {
        const base = `chapters[${chapterIndex}].lessons[${lessonIndex}]`;
        lessons.push({
          lessonname: req.body[`${base}.lessonname`],
          audioFile: fileMap[`${base}.audio`] || [],
          videoFile: fileMap[`${base}.video`] || [],
          pdfFile: fileMap[`${base}.pdf`] || [],
        });

        lessonIndex++;
      }

      chapters.push({ title, lessons });
      chapterIndex++;
    }

    // Handle price
    const amount = parseFloat(req.body["price.amount"]) || 0;
    const discount = parseFloat(req.body["price.discount"]) || 0;
    const finalPrice = amount * (1 - discount / 100);

    // Assemble course
    const course = new Course({
      tutor: tutor._id, // Add reference to tutor
      CourseMotherId: finalCourseMotherId,
      coursename,
      category,
      courseduration,
      thumbnail: fileMap["thumbnail"]?.[0]?.url || req.body.thumbnail || "",
      previewVideo: fileMap["previewvideo"] || [],
      contentduration: {
        hours: parseInt(req.body["contentduration.hours"]) || 0,
        minutes: parseInt(req.body["contentduration.minutes"]) || 0,
      },
      chapters,
      price: {
        amount,
        currency: req.body["price.currency"] || "INR",
        discount,
        finalPrice,
      },
      level: req.body.level,
      language: req.body.language,
      certificates: req.body.certificates,
      instructor: {
        name: req.body["instructor.name"],
        role: req.body["instructor.role"],
        socialmedia_id: req.body["instructor.socialmedia_id"],
      },
      description: req.body.description || "",
      whatYoullLearn: Array.isArray(req.body.whatYoullLearn)
        ? req.body.whatYoullLearn
        : typeof req.body.whatYoullLearn === "string"
        ? req.body.whatYoullLearn.split(",")
        : [],
    });

    console.log("🛠️ Saving course to DB...");
    const saved = await course.save();
    
    // Increment tutor's course count
    await Tutor.findByIdAndUpdate(tutor._id, {
      $inc: { totalCoursesUploaded: 1 }
    });
    
    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: {
        courseId: saved._id,
        CourseMotherId: saved.CourseMotherId,
        coursename: saved.coursename,
      },
    });
  } catch (error) {
    console.error("❌ Course creation failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};



// Get courses name
export const getCourseNames = async (req, res) => {
  try {
    const courses = await Course.find({}, "coursename chapters.title");
    
    // Optional: Format the response if needed
    const formattedCourses = courses.map((course) => ({
      coursename: course.coursename,
      chapters: course.chapters.map((chapter) => chapter.title),
    }));

    res.status(200).json(formattedCourses);
  } catch (error) {
    console.error("❌ Failed to get course names:", error);
    res.status(500).json({ error: "Failed to fetch course names" });
  }
};

// Get courses
export const getCourseByName = async (req, res) => {
  try {
    const { coursename } = req.params;

    if (!coursename) {
      return res.status(400).json({ error: "coursename is required" });
    }

    const course = await Course.findOne({ coursename });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json(course);
  } catch (error) {
    console.error("❌ Error fetching course:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get courses by tutor
export const getCoursesByTutor = async (req, res) => {
  try {
    // Use authenticated user id from token (req.user is set by verifyToken middleware)
    const tutorParam = req.user?.id;

    if (!tutorParam) {
      return res.status(401).json({ success: false, error: "Unauthorized: tutor id not found in token" });
    }

    if (!mongoose.Types.ObjectId.isValid(tutorParam)) {
      return res.status(400).json({ error: "Invalid tutor id format" });
    }

    // Optionally ensure the tutor exists
    const tutorExists = await Tutor.findById(tutorParam).select("_id name email");
    if (!tutorExists) {
      return res.status(404).json({ success: false, error: "Tutor not found" });
    }

    const courses = await Course.find({ tutor: tutorParam }).populate(
      "tutor",
      "name email"
    );

    if (!courses || courses.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No courses found for tutor: ${tutorParam}`,
      });
    }

    res.status(200).json({ success: true, count: courses.length, data: courses });
  } catch (error) {
    console.error("❌ Error fetching courses by tutor:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteFromS3 = async (fileUrl) => {
  try {
    const parsedUrl = new URL(fileUrl);
    const Key = parsedUrl.pathname.substring(1); // Remove leading slash

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_TUTOR,
      Key,
    });

    await s3.send(command);
    return true;
  } catch (error) {
    console.error(`❌ Error deleting file from S3:`, error);
    return false;
  }
};

export const updateCourse = async (req, res) => {
  try {
    const courseName = req.params.coursename;
    const existingCourse = await Course.findOne({ coursename: courseName });

    if (!existingCourse) {
      return res.status(404).json({ error: "Course not found" });
    }

    const courseFolder = existingCourse.coursename
      .toLowerCase()
      .replace(/\s+/g, "-");
    const files = req.files || [];
    const fileMap = {};
    const filesToDelete = req.body.filesToDelete || [];

    // Step 1: Delete requested files from S3
    if (filesToDelete.length > 0) {
      await Promise.all(
        filesToDelete.map(async (fileData) => {
          try {
            const file =
              typeof fileData === "string" ? JSON.parse(fileData) : fileData;
            if (!file.url) return;
            await deleteFromS3(file.url);
          } catch (error) {
            console.error(`❌ Error processing file deletion:`, error);
          }
        })
      );
    }

    // Step 2: Upload new files to S3
    for (const file of files) {
      const field = file.fieldname;
      let folder = "misc";

      // Determine folder based on file type
      if (field.includes("previewvideo")) folder = "preview";
      else if (field.includes("thumbnail")) folder = "thumbnail";
      else if (field.includes("audio")) folder = "audio";
      else if (field.includes("video")) folder = "video";
      else if (field.includes("pdf")) folder = "pdf";

      let rawName = null;
      const match = field.match(
        /chapters\[(\d+)\]\.lessons\[(\d+)\]\.(audio|video|pdf)File/
      );

      if (match) {
        const [_, chIdx, lsnIdx, type] = match;
        const key = `chapters[${chIdx}].lessons[${lsnIdx}].${type}name`;
        const val = req.body[key];
        if (Array.isArray(val)) rawName = val[fileMap[field]?.length || 0];
        else rawName = val;
      }

      const uploadedFile = await uploadToS3(
        file,
        `${courseFolder}/${folder}`,
        rawName
      );

      if (!fileMap[field]) fileMap[field] = [];
      fileMap[field].push(uploadedFile);
    }

    // Step 3: Rebuild course structure
    const updatedChapters = [];
    let chapterIndex = 0;

    while (req.body[`chapters[${chapterIndex}].title`] !== undefined) {
      const title = req.body[`chapters[${chapterIndex}].title`];
      const lessons = [];

      let lessonIndex = 0;
      while (
        req.body[
          `chapters[${chapterIndex}].lessons[${lessonIndex}].lessonname`
        ] !== undefined
      ) {
        const base = `chapters[${chapterIndex}].lessons[${lessonIndex}]`;

        // Get existing lesson or create new one
        const existingLesson = existingCourse.chapters[chapterIndex]?.lessons[
          lessonIndex
        ] || { audioFile: [], videoFile: [], pdfFile: [] };

        // Filter out deleted files and add new ones
        const lessonData = {
          lessonname: req.body[`${base}.lessonname`],
          audioFile: [
            ...(existingLesson.audioFile || []).filter(
              (file) => !filesToDelete.some((f) => f.url === file.url)
            ),
            ...(fileMap[`${base}.audioFile`] || []),
          ],
          videoFile: [
            ...(existingLesson.videoFile || []).filter(
              (file) => !filesToDelete.some((f) => f.url === file.url)
            ),
            ...(fileMap[`${base}.videoFile`] || []),
          ],
          pdfFile: [
            ...(existingLesson.pdfFile || []).filter(
              (file) => !filesToDelete.some((f) => f.url === file.url)
            ),
            ...(fileMap[`${base}.pdfFile`] || []),
          ],
        };

        lessons.push(lessonData);
        lessonIndex++;
      }

      updatedChapters.push({ title, lessons });
      chapterIndex++;
    }

    // Step 4: Update course metadata
    existingCourse.coursename =
      req.body.coursename || existingCourse.coursename;
    existingCourse.category = req.body.category || existingCourse.category;
    existingCourse.courseduration =
      req.body.courseduration || existingCourse.courseduration;

    // Handle thumbnail update/removal
    if (fileMap["thumbnail"]?.[0]) {
      existingCourse.thumbnail = fileMap["thumbnail"][0].url;
    } else if (req.body.thumbnail === "") {
      // If thumbnail was explicitly set to empty, remove it
      if (existingCourse.thumbnail) {
        await deleteFromS3(existingCourse.thumbnail);
      }
      existingCourse.thumbnail = undefined;
    }

    // Handle preview video update/removal
    if (fileMap["previewvideo"]?.[0]) {
      existingCourse.previewvedio = fileMap["previewvideo"][0].url;
    } else if (req.body.previewvedio === "") {
      // If preview video was explicitly set to empty, remove it
      if (existingCourse.previewvedio) {
        await deleteFromS3(existingCourse.previewvedio);
      }
      existingCourse.previewvedio = undefined;
    }

    // Update other fields
    existingCourse.contentduration = {
      hours:
        parseInt(req.body["contentduration.hours"]) ||
        existingCourse.contentduration.hours ||
        0,
      minutes:
        parseInt(req.body["contentduration.minutes"]) ||
        existingCourse.contentduration.minutes ||
        0,
    };

    existingCourse.level = req.body.level || existingCourse.level;
    existingCourse.language = req.body.language || existingCourse.language;
    existingCourse.certificates =
      req.body.certificates || existingCourse.certificates;

    existingCourse.instructor = {
      name: req.body["instructor.name"] || existingCourse.instructor?.name,
      role: req.body["instructor.role"] || existingCourse.instructor?.role,
      socialmedia_id:
        req.body["instructor.socialmedia_id"] ||
        existingCourse.instructor?.socialmedia_id,
    };

    existingCourse.description =
      req.body.description || existingCourse.description;

    if (req.body.whatYoullLearn) {
      existingCourse.whatYoullLearn = Array.isArray(req.body.whatYoullLearn)
        ? req.body.whatYoullLearn
        : req.body.whatYoullLearn.split(",").map((item) => item.trim());
    }

    // Update pricing
    const amount =
      parseFloat(req.body["price.amount"]) || existingCourse.price.amount;
    const discount =
      parseFloat(req.body["price.discount"]) ||
      existingCourse.price.discount ||
      0;

    existingCourse.price = {
      amount,
      currency:
        req.body["price.currency"] || existingCourse.price.currency || "INR",
      discount,
      finalPrice: amount * (1 - discount / 100),
    };

    // Update chapters
    if (updatedChapters.length > 0) {
      existingCourse.chapters = updatedChapters;
    }

    // Save the updated course
    const updatedCourse = await existingCourse.save();

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      course: updatedCourse,
    });
  } catch (error) {
    console.error("❌ Update course error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Delete course function (was missing)
export const deleteCourse = async (req, res) => {
  try {
    const { coursename } = req.params;
    const { hard = false } = req.query;

    if (!coursename) {
      return res.status(400).json({
        success: false,
        error: "coursename is required",
      });
    }

    const course = await Course.findOne({ coursename });
    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found",
      });
    }

    if (hard === "true") {
      // Hard delete: Remove from database and clean up S3 files
      const deletePromises = [];

      if (course.thumbnail) deletePromises.push(deleteFromS3(course.thumbnail));
      if (course.previewvedio)
        deletePromises.push(deleteFromS3(course.previewvedio));

      course.chapters.forEach((chapter) => {
        chapter.lessons.forEach((lesson) => {
          lesson.audioFile.forEach((file) =>
            deletePromises.push(deleteFromS3(file.url))
          );
          lesson.videoFile.forEach((file) =>
            deletePromises.push(deleteFromS3(file.url))
          );
          lesson.pdfFile.forEach((file) =>
            deletePromises.push(deleteFromS3(file.url))
          );
        });
      });

      await Promise.allSettled(deletePromises);
      await Course.findByIdAndDelete(course._id);

      res.status(200).json({
        success: true,
        message: "Course permanently deleted successfully",
      });
    } else {
      // Soft delete
      course.isDeleted = true;
      course.deletedAt = new Date();
      await course.save();

      res.status(200).json({
        success: true,
        message: "Course deleted successfully",
      });
    }
  } catch (error) {
    console.error("❌ Delete course error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get courses by category
export const getCoursesByCategory = async (req, res) => {
  try {
    // URL-லிருந்து category பெயரைப் பெறுகிறோம் (e.g., "Yoga", "Siddha Medicine")
    const { categoryName } = req.params;

    if (!categoryName) {
      return res.status(400).json({ error: "Category name is required" });
    }
    
    // category ஃபீல்டை வைத்து டேட்டாபேஸில் தேடுகிறோம்
    const courses = await Course.find({ category: categoryName });

    if (!courses || courses.length === 0) {
      return res.status(404).json({ message: `No courses found for category: ${categoryName}` });
    }

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });

  } catch (error) {
    console.error(`❌ Error fetching courses by category: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
};