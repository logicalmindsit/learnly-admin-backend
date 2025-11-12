
import { Schema, model } from "mongoose";

// Main Postclass schema for Student PCM live classes
const postclassSchema = new Schema(
	{
		className: {
			type: String,
			required: true,
			trim: true,
		},
		batch: {
			type: String,
			required: true,
			trim: true,
		},
		academicYear: {
			type: String,
			required: true,
			trim: true,
		},
		//Google Meet links for each subject
		meetLink: {
			type: String,
			required: true,
			trim: true,
		},
		// Class schedule
		selectedSubject: {
			type: String,
			required: true,
			enum: ['physics', 'chemistry', 'mathematics'],
		},
		startTime: {
			type: Date,
			required: true,
		},
		endTime: {
			type: Date,
            required: true,
		},
		timezone: {
			type: String,
			trim: true,
			default: "Asia/Kolkata",
		},
		is_active: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// Index on className/batch for quick lookup
postclassSchema.index({ className: 1, batch: 1 });

// Helper: get meet link for selected subject
postclassSchema.methods.getMeetLink = function() {
    switch(this.selectedSubject) {
        case 'physics': return this.physicsMeetLink;
        case 'chemistry': return this.chemistryMeetLink;
        case 'mathematics': return this.mathsMeetLink;
        default: return null;
    }
};

const Postclass = model("PCM", postclassSchema);

export default Postclass;

/*
Example document to create/update:

{
    "className": "PCM - Grade 12",
    "batch": "Morning-1",
    "academicYear": "2025-2026",
    "physicsMeetLink": "meet.google.com/abc-defg-hij",
    "chemistryMeetLink": "meet.google.com/chem-xyz-123",
    "mathsMeetLink": "meet.google.com/math-789-000",
    "selectedSubject": "physics",
    "startTime": "2025-11-10T08:00:00.000Z",
    "endTime": "2025-11-10T09:00:00.000Z",
    "timezone": "Asia/Kolkata"
}

*/
