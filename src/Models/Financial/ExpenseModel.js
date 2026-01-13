import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      enum: [
        "Salary",
        "Website Maintenance",
        "Infrastructure",
        "Utilities",
        "Supplies",
        "Marketing",
        "Events",
        "Maintenance",
        "Transport",
        "Technology",
        "Other",
      ],
      required: true,
    },
    subCategory: {
      type: String,
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Online", "Cheque", "Bank Transfer", "Card", "Other"],
      default: "Cash",
    },
    transactionId: {
      type: String,
      trim: true,
    },
    invoiceNumber: {
      type: String,
      unique: true,
      trim: true,
    },
    vendorName: {
      type: String,
      trim: true,
    },
    vendorContact: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Paid", "Rejected", "Cancelled"],
      default: "Pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin-data-login",
    },
    approvedDate: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin-data-login",
      required: true,
    },
    department: {
      type: String,
      trim: true,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPeriod: {
      type: String,
      enum: ["Monthly", "Quarterly", "Yearly", "None"],
      default: "None",
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
          enum: ["Created", "Updated", "Approved", "Paid", "Rejected", "Cancelled", "Deleted"],
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
expenseSchema.index({ date: -1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ category: 1 });

// Generate invoice number before saving (financial year Apr 1 - Mar 31)
expenseSchema.pre("save", async function (next) {
  if (!this.invoiceNumber) {
    const docDate = this.date ? new Date(this.date) : new Date();
    const fyStartYear = docDate.getMonth() + 1 >= 4 ? docDate.getFullYear() : docDate.getFullYear() - 1;
    const fyStart = new Date(fyStartYear, 3, 1); // April 1
    const fyEnd = new Date(fyStartYear + 1, 3, 1); // next April 1

    const count = await mongoose.models.Expense.countDocuments({
      date: { $gte: fyStart, $lt: fyEnd },
    });

    const fyLabel = `${fyStartYear}-${fyStartYear + 1}`; // e.g. 2025-2026
    this.invoiceNumber = `EXP-GKVK-${fyLabel}-${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;
