
import StaffDetails from "../../Models/Data-Maintenance/staff-details-model.js";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";

// Configure AWS S3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Upload file to S3
const uploadToS3 = async (file) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `staff-profiles/${Date.now()}-${file.originalname}`,
    Body: fs.createReadStream(file.path),
    ContentType: file.mimetype,
  };

  const command = new PutObjectCommand(params);
  const result = await s3.send(command);
  
  // Return the URL manually since v3 doesn't return Location
  return {
    Location: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`,
    Key: params.Key
  };
};

// Delete file from S3
const deleteFromS3 = async (key) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  };

  const command = new DeleteObjectCommand(params);
  return s3.send(command);
};


// Create new staff with profile picture
export const createStaff = async (req, res) => {
  try {
    const { name, gender, age, address, aadharNumber, designation } = req.body;
    console.log("req.body is ",req.body)
    console.log("req.file is ",req.file)

    const requiredFields = { name, gender, age, address, aadharNumber, designation };
    console.log("requiredFields is ",requiredFields)
    const missingFields = Object.entries(requiredFields)
    .filter(([key, value]) => value === undefined || value === null || value === '')
    .map(([key]) => key);
    if (missingFields.length > 0) {
        return res.status(400).json({
            success: false,
            message: `Missing required fields: ${missingFields.join(', ')}`
        });
    }

    const existingStaff = await StaffDetails.findOne({ aadharNumber });
    if (existingStaff) {
      return res.status(400).json({
        success: false,
        message: 'Staff with this Aadhar number already exists'
      });
    }
    

    const addressObj =
      typeof address === "string" ? JSON.parse(address) : address;

    const staffData = {
      name,
      gender,
      age,
      address: addressObj,
      aadharNumber,
      designation,
    };

    if (req.file) {
      const result = await uploadToS3(req.file);
      staffData.profilePicture = {
        public_id: result.Key,
        url: result.Location,
      };

      fs.unlinkSync(req.file.path);
      console.log("🧹 Temporary file deleted from local uploads folder:", req.file.path);
    }

    const staff = await StaffDetails.create(staffData);
    res.status(201).json({success: true,staff});
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all staff with pagination
export const getAllStaff = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const staff = await StaffDetails.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await StaffDetails.countDocuments();

    res.status(200).json({
      success: true,
      staff,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update staff with profile picture
export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, gender, age, address, aadharNumber, designation } = req.body;

    // Parse address if it's a string
    const addressObj =
      typeof address === "string" ? JSON.parse(address) : address;

    const updateData = {
      name,
      gender,
      age,
      address: addressObj,
      aadharNumber,
      designation,
    };

    const staff = await StaffDetails.findById(id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    // If new file is uploaded
    if (req.file) {
      // Delete old image from S3 if exists
      if (staff.profilePicture?.public_id) {
        await deleteFromS3(staff.profilePicture.public_id);
      }

      // Upload new image
      const result = await uploadToS3(req.file);
      updateData.profilePicture = {
        public_id: result.Key,
        url: result.Location,
      };
      // Remove file from local storage after upload
      fs.unlinkSync(req.file.path);
    }

    const updatedStaff = await StaffDetails.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      staff: updatedStaff,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete staff
export const deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;

        const staff = await StaffDetails.findById(id);
        console.log("staff is ", staff)
        if (!staff) {
            return res.status(404).json({
                success: false,
                message: "Staff not found",
            });
        }

        // Delete profile picture from S3 if exists
        if (staff.profilePicture?.public_id) {
            await deleteFromS3(staff.profilePicture.public_id);
        }

        await StaffDetails.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Staff deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};