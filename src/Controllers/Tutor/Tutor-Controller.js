import Tutor from "../../Models/Tutor/TutorModel.js";
import bcrypt from "bcryptjs";
import { sendTutorCredentialsEmail } from "../../Notification/TutorEmailService.js";

// 🔹 Validate base64 image
const validateBase64Image = (base64String) => {
  if (!base64String) return false;
  
  // Check if it's a valid base64 string with image mime type
  const regex = /^data:image\/(jpeg|jpg|png|gif);base64,/;
  if (!regex.test(base64String)) return false;

  // Check if the remaining string is valid base64
  try {
    const base64Data = base64String.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    // Check if size is less than 5MB
    if (buffer.length > 5 * 1024 * 1024) return false;
    return true;
  } catch (error) {
    return false;
  }
};

// 🔹 Create Tutor Account 
export const createTutor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      mobilenumber,
      qualification,
      subject,
      experience,
      address,
      govtIdProofs,
      gender,
      role,
      age,
      profilePictureUpload
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !mobilenumber) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, and mobile number are required fields"
      });
    }

    // Validate profile picture if provided
    if (profilePictureUpload) {
      if (!validateBase64Image(profilePictureUpload)) {
        return res.status(400).json({
          success: false,
          message: "Invalid profile picture format. Please provide a valid image (JPEG, PNG, or GIF) less than 5MB"
        });
      }
    }

    // Validate government ID proofs if provided
    if (govtIdProofs && govtIdProofs.length > 0) {
      for (const proof of govtIdProofs) {
        if (proof.documentImage && !validateBase64Image(proof.documentImage)) {
          return res.status(400).json({
            success: false,
            message: `Invalid document image for ${proof.idType}. Please provide a valid image (JPEG, PNG, or GIF) less than 5MB`
          });
        }
      }
    }

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address"
      });
    }

    // Validate mobile number format
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobilenumber)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 10-digit mobile number"
      });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one number and one special character"
      });
    }

    // Check if email already exists
    const existingTutorEmail = await Tutor.findOne({ email });
    if (existingTutorEmail) {
      return res.status(400).json({
        success: false,
        message: "Tutor with this email already exists"
      });
    }

    // Check if mobile number already exists
    const existingTutorMobile = await Tutor.findOne({ mobilenumber });
    if (existingTutorMobile) {
      return res.status(400).json({
        success: false,
        message: "Tutor with this mobile number already exists"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new Tutor
    const newTutor = new Tutor({
      name,
      email,
      mobilenumber,
      password: hashedPassword,
      qualification,
      subject,
      experience,
      address,
      govtIdProofs,
      role,
      gender,
      age,
      profilePictureUpload,
      isApproved: true,
      subscriptionStatus: "active",
      isFirstTime: true,
      passwordUpdatedAt: new Date(),
      otpAttempts: 0
    });

    // Save to database
    await newTutor.save();

    // Attempt to send credentials email to the tutor (non-blocking for success)
    let emailResult = null;
    try {
      // loginEmail is the same as the provided email here
      emailResult = await sendTutorCredentialsEmail(email, name, email, password);
      if (!emailResult || !emailResult.success) {
        console.warn("Credentials email was not sent successfully:", emailResult);
      }
    } catch (emailErr) {
      console.error("Error while sending credentials email:", emailErr);
      emailResult = { success: false, message: emailErr.message || 'Error sending email' };
    }

    res.status(201).json({
      success: true,
      message: "Tutor account created successfully",
      tutor: {
        tutorId: newTutor.tutorId,
        name: newTutor.name,
        email: newTutor.email,
        subject: newTutor.subject,
        qualification: newTutor.qualification,
      },
      email: emailResult,
    });
  } catch (error) {
    console.error("Error creating tutor:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create tutor account",
      error: error.message,
    });
  }
};

// 🔹 Get All Tutors with Pagination and Filters
export const getAllTutors = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      subject,
      qualification,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    // Build query based on filters
    const query = {};
    
    // Add filters if provided
    if (status) {
      query.subscriptionStatus = status;
    }
    if (subject) {
      query.subject = { $regex: subject, $options: 'i' };
    }
    if (qualification) {
      query.qualification = { $regex: qualification, $options: 'i' };
    }
    
    // Add search functionality across multiple fields
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { tutorId: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    // Build sort object
    const sortObject = {};
    sortObject[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Fetch tutors with all details except sensitive information
    const tutors = await Tutor.find(query)
      .select('-password -otp -otpExpiresAt -forgotPasswordOtp -forgotPasswordOtpExpiresAt -otpAttempts')
      .sort(sortObject)
      .skip(skip)
      .limit(parseInt(limit));

    const totalTutors = await Tutor.countDocuments(query);

    // Get subscription status counts
    const statusCounts = await Tutor.aggregate([
      { $group: { 
        _id: '$subscriptionStatus', 
        count: { $sum: 1 } 
      }}
    ]);

    // Calculate additional statistics
    const statistics = {
      totalTutors,
      subscriptionStatus: Object.fromEntries(
        statusCounts.map(status => [status._id, status.count])
      ),
      activePercentage: (
        (statusCounts.find(s => s._id === 'active')?.count || 0) / totalTutors * 100
      ).toFixed(2)
    };

    return res.status(200).json({
      success: true,
      data: {
        tutors: tutors,
        statistics,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalTutors / limit),
          totalTutors,
          limit: parseInt(limit),
        },
        filters: {
          status,
          subject,
          qualification,
          search
        }
      },
    });
  } catch (error) {
    console.error("Get all tutors error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch tutors",
      error: error.message,
    });
  }
};

// 🔹 Approve Tutor terms & conditions
export const approveTutor = async (req, res) => {
  try {
    // Get email from JWT token (set by auth middleware)
    if (!req.user || !req.user.email) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Email not found in token",
      });
    }

    const email = req.user.email;

    // Update tutor approval status
    const updatedTutor = await Tutor.findOneAndUpdate(
      { email },
      { isApproved: true },
      {
        new: true,
        projection:
          "-password -otp -otpExpiresAt -forgotPasswordOtp -forgotPasswordOtpExpiresAt -otpAttempts",
      }
    );

    if (!updatedTutor) {
      return res.status(404).json({
        success: false,
        message: "Tutor not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Tutor approved successfully",
      tutor: updatedTutor,
    });
  } catch (error) {
    console.error("Approve tutor error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to approve tutor",
      error: error.message,
    });
  }
};

