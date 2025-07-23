import { Schema, model } from "mongoose";

// DirectMeet Schema
const directMeetSchema = new Schema(
  {
    meet_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    meet_title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    apply_meet_start_date: {
      type: Date,
      required: true,
    },
    apply_meet_end_date: {
      type: Date,
      required: true,
      validate: {
        validator: function (endDate) {
          return endDate > this.apply_meet_start_date;
        },
        message: "Apply meet end date must be after apply meet start date",
      },
    },
    meet_conduct_from_date: {
      type: Date,
      required: true,
    },
    meet_completed_date: {
      type: Date,
      validate: {
        validator: function (completedDate) {
          if (completedDate) {
            return completedDate >= this.meet_conduct_from_date;
          }
          return true;
        },
        message: "Meet completed date must be after or equal to meet conduct from date",
      },
    },
    fees: {
      type: Number,
      required: true,
      min: [0, "Fees cannot be negative"],
    },
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming",
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual field to check if meet is currently accepting applications
directMeetSchema.virtual('is_application_open').get(function() {
  const now = new Date();
  return now >= this.apply_meet_start_date && now <= this.apply_meet_end_date;
});

// Virtual field to check if meet is currently ongoing
directMeetSchema.virtual('is_meet_ongoing').get(function() {
  const now = new Date();
  return now >= this.meet_conduct_from_date && (!this.meet_completed_date || now <= this.meet_completed_date);
});

// Pre-save middleware to auto-update status
directMeetSchema.pre('save', function(next) {
  const now = new Date();
  
  if (this.meet_completed_date && now > this.meet_completed_date) {
    this.status = 'completed';
  } else if (now >= this.meet_conduct_from_date) {
    this.status = 'ongoing';
  } else if (now >= this.apply_meet_start_date && now <= this.apply_meet_end_date) {
    this.status = 'upcoming';
  }
  
  next();
});

// Index for better query performance
directMeetSchema.index({ apply_meet_start_date: 1, apply_meet_end_date: 1 });
directMeetSchema.index({ meet_conduct_from_date: 1 });
directMeetSchema.index({ status: 1 });
directMeetSchema.index({ is_active: 1 });

const DirectMeet = model("DirectMeet", directMeetSchema);

export default DirectMeet;
