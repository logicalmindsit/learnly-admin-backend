import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
    donorName: {
      type: String,
      required: true,
      trim: true,
    },
    donorEmail: {
      type: String,
      trim: true,
    },
    donorPhone: {
      type: String,
      trim: true,
    },
    panNumber: {
      type: String,
      trim: true,
      required: function() { return !this.isAnonymous; },
    },
    upiId: {
      type: String,
      trim: true,
    },
    chequeNumber: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    donationType: {
      type: String,
      enum: ["Cash", "Online", "Cheque", "Bank Transfer", "Other"],
      default: "Cash",
    },
    category: {
      type: String,
      enum: ["General", "Infrastructure", "Scholarship", "Event", "Other"],
      default: "General",
    },
    transactionId: {
      type: String,
      trim: true,
    },
    receiptNumber: {
      type: String,
      unique: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    description: {
      type: String,
      trim: true,
    },
    purpose: {
      type: String,
      trim: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Pending", "Verified", "Completed", "Cancelled"],
      default: "Completed",
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin-data-login",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin-data-login",
      required: true,
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    auditLog: [
      {
        action: {
          type: String,
          enum: ["Created", "Updated", "Verified", "Cancelled", "Deleted"],
        },
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Admin-data-login",
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        changes: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
donationSchema.index({ date: -1 });
donationSchema.index({ status: 1 });
donationSchema.index({ category: 1 });

// Generate receipt number before saving (financial year Apr 1 - Mar 31)
donationSchema.pre("save", async function (next) {
  if (!this.receiptNumber) {
    const docDate = this.date ? new Date(this.date) : new Date();
    const fyStartYear = docDate.getMonth() + 1 >= 4 ? docDate.getFullYear() : docDate.getFullYear() - 1;
    const fyStart = new Date(fyStartYear, 3, 1);
    const fyEnd = new Date(fyStartYear + 1, 3, 1);

    const count = await mongoose.models.Donation.countDocuments({
      date: { $gte: fyStart, $lt: fyEnd },
    });

    const fyLabel = `${fyStartYear}-${fyStartYear + 1}`; // e.g. 2025-2026
    this.receiptNumber = `DON-GKVK-${fyLabel}-${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

const Donation = mongoose.model("Donation", donationSchema);

export default Donation;
