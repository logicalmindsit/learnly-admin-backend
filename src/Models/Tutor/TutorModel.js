import { Schema, model } from "mongoose";

// Login History Sub-Schema
const loginHistorySchema = new Schema(
  {
    loginTime: { type: Date, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    logoutTime: { type: Date },
    sessionDuration: { type: Number },
  },
  { _id: false }
);

const tutorSchema = new Schema(
  {
    // Auto-generated Tutor ID (unique identifier)
    tutorId: {
      type: String,
      unique: true,
      required: true,
      default: function() {
        return `TUTOR${Math.floor(100000 + Math.random() * 900000)}`;
      },
    },

    // Tutor Details
    name: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ],
    },
    mobilenumber: {
      type: String,
      unique: true,
      required: true,
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"],
    },
    age: { type: Number, min: 18, max: 100 },
    // Additional Tutor Information
    qualification: {
      type: String,
      trim: true,
      default: null,
    },
    subject: {
      type: String,
      trim: true,
      default: null,
    },
    experience: {
      type: String,
      trim: true,
      default: null,
    },
    address: {
      street: { type: String, default: null, trim: true },
      city: { type: String, default: null, trim: true },
      state: { type: String, default: null, trim: true },
      zipCode: { type: String, default: null, trim: true },
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
    },
    govtIdProofs: [
      {
        idType: {
          type: String,
          enum: ["Aadhar", "PAN", "Passport", "VoterID", "DrivingLicense"],
          required: true,
        },
        idNumber: { type: String, required: true, trim: true },
        documentImage: { type: String }, // URL or base64 image of the document
      },
    ],
    profilePictureUpload: { type: String }, // URL or base64 image
    role: {
      type: String,
      default: "tutor",
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: [8, "Password must be at least 8 characters long"],
      match: [
        /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/,
        "Password must contain at least one lowercase letter, one uppercase letter, one number and one special character",
      ],
    },
    // Subscription/Renewal Status
    subscriptionStatus: {
      type: String,
      enum: ["active", "expired", "pending"],
      default: "active",
    },
    subscriptionExpiryDate: {
      type: Date,
      default: null,
    },

    // Stats
    totalCoursesUploaded: {
      type: Number,
      default: 0,
    },

    // Metadata
    isApproved: {
      type: Boolean,
      default: false,
    },

    isFirstTime: { type: Boolean, default: true },
    otp: { type: String },
    otpExpiresAt: { type: Date },
    forgotPasswordOtp: { type: String },
    forgotPasswordOtpExpiresAt: { type: Date },
    forgotPasswordOtpVerified: { type: Boolean, default: false },
    loginHistory: [loginHistorySchema],
  },
  {
    timestamps: true,
  }
);

// Additional security tracking
tutorSchema.add({
  otpAttempts: { type: Number, default: 0 },
  passwordUpdatedAt: { type: Date },
});


const Tutor = model("Tutor", tutorSchema);
export default Tutor;
