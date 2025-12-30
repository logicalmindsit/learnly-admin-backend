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

// BOS Details Sub-Schema
const bosDetailsSchema = new Schema(
  {
    member_id: {
      type: String,
      required: function () {
        return this.role === "bosmembers" || this.role === "boscontroller";
      },
    },
    designation: {
      type: String,
      required: function () {
        return this.role === "bosmembers" || this.role === "boscontroller";
      },
    },
    joining_date: {
      type: Date,
      required: function () {
        return this.role === "bosmembers" || this.role === "boscontroller";
      },
    },
    term_end: {
      type: Date,
      required: function () {
        return this.role === "bosmembers" || this.role === "boscontroller";
      },
    },
  },
  { _id: false }
);

// Admin Schema
const adminSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true, required: true },
    mobilenumber: { type: String, unique: true, sparse: true, required: true },
    password: { type: String, required: true },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
    },
    age: { type: Number, min: 18, max: 100 },
    permanentAddress: { type: String, trim: true },
    tempAddress: { type: String, trim: true },
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
    designationInBoard: { type: String, trim: true },

    profilePictureUpload: { type: String }, // URL or base64 image
    role: {
      type: String,
      enum: [
      "superadmin",
      "admin",
      "boscontroller",
      "bosmembers",
      "committeeoftrustees",
      "coursemanagement",
      "tutormanagement",
      "usermanagement",
      "documentverification",
      "marketing",
      "auditor",
      "Financial",
      ],
      default: "admin",
    },
    bosDetails: {
      type: bosDetailsSchema,
      required: function () {
        return this.role === "bosmembers" || this.role === "boscontroller";
      },
      validate: {
        validator: function (v) {
          if (this.role === "bosmembers" || this.role === "boscontroller") {
            return v != null;
          }
          return true;
        },
        message: "BOS details are required for BOS members and controllers",
      },
    },
    isFirstTime: { type: Boolean, default: true },
    otp: { type: String },
    otpExpiresAt: { type: Date },
    forgotPasswordOtp: { type: String },
    forgotPasswordOtpExpiresAt: { type: Date },
    forgotPasswordOtpVerified: { type: Boolean, default: false },
    loginHistory: [loginHistorySchema],
  },
  { timestamps: true }
);

const Admin = model("Admin-data-login", adminSchema);
export default Admin;
