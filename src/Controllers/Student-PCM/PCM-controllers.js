import Postclass from "../../Models/Student-PCM/Postclass-Model.js";

// Get Meet link based on selected subject from environment variables
function getMeetLinkForSubject(subject) {
    switch (subject) {
        case 'physics':
            return process.env.PHYSICS_MEET_LINK;
        case 'chemistry':
            return process.env.CHEMISTRY_MEET_LINK;
        case 'mathematics':
            return process.env.MATHS_MEET_LINK;
        default:
            throw new Error('Invalid subject selected');
    }
}

// Validate required environment variables
function validateMeetLinks() {
    if (!process.env.PHYSICS_MEET_LINK) throw new Error('PHYSICS_MEET_LINK not set in environment');
    if (!process.env.CHEMISTRY_MEET_LINK) throw new Error('CHEMISTRY_MEET_LINK not set in environment');
    if (!process.env.MATHS_MEET_LINK) throw new Error('MATHS_MEET_LINK not set in environment');
}

// Create a new PCM class document with meet link based on selected subject
export const createPostclass = async (req, res) => {
    try {
        // First validate that all required Meet links are set in environment
        validateMeetLinks();

        const { className, batch, academicYear, selectedSubject, startTime, endTime, timezone } = req.body;

        // Get the appropriate Meet link based on selected subject
        const meetLink = getMeetLinkForSubject(selectedSubject);

        // Create the class document
        const created = await Postclass.create({
            className,
            batch,
            academicYear,
            selectedSubject,
            meetLink,
            startTime,
            endTime,
            timezone: timezone || "Asia/Kolkata",
        });

        return res.status(201).json({ success: true, data: created });
    } catch (error) {
        console.error("createPostclass error:", error);
        return res.status(500).json({ 
            success: false, 
            error: error.message || "Failed to create PCM class"
        });
    }
};

// List all PCM classes with filters
export const listPostclasses = async (req, res) => {
    try {
        const { className, batch, academicYear, selectedSubject } = req.query;
        
        // Build filter object based on query parameters
        const filter = {};
        if (className) filter.className = new RegExp(className, 'i');
        if (batch) filter.batch = new RegExp(batch, 'i');
        if (academicYear) filter.academicYear = academicYear;
        if (selectedSubject) filter.selectedSubject = selectedSubject;

        const docs = await Postclass.find(filter)
            .sort({ startTime: 1 }) // Sort by start time ascending
            .limit(100);

        return res.json({ 
            success: true, 
            count: docs.length,
            data: docs 
        });
    } catch (error) {
        console.error("listPostclasses error:", error);
        return res.status(500).json({ 
            success: false, 
            error: error.message || "Failed to fetch PCM classes"
        });
    }
};

// Update an existing PCM class document
export const updatePostclass = async (req, res) => {
    try {
        validateMeetLinks();
        
        const id = req.params.id;
        const { className, batch, academicYear, selectedSubject, startTime, endTime, timezone } = req.body;

        // If subject is being updated, get the new Meet link
        const updateData = {
            className,
            batch,
            academicYear,
            startTime,
            endTime
        };

        if (timezone) updateData.timezone = timezone;
        
        // Only update Meet link if subject is changing
        if (selectedSubject) {
            updateData.selectedSubject = selectedSubject;
            updateData.meetLink = getMeetLinkForSubject(selectedSubject);
        }

        const updated = await Postclass.findByIdAndUpdate(
            id, 
            updateData,
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ 
                success: false, 
                error: "PCM class not found" 
            });
        }

        return res.json({ success: true, data: updated });
    } catch (error) {
        console.error("updatePostclass error:", error);
        return res.status(500).json({ 
            success: false, 
            error: error.message || "Failed to update PCM class"
        });
    }
};

// Delete a PCM class
export const deletePostclass = async (req, res) => {
    try {
        const id = req.params.id;
        const deleted = await Postclass.findByIdAndDelete(id);
        
        if (!deleted) {
            return res.status(404).json({ 
                success: false, 
                error: "PCM class not found" 
            });
        }

        return res.json({ 
            success: true, 
            message: "PCM class deleted successfully",
            data: deleted 
        });
    } catch (error) {
        console.error("deletePostclass error:", error);
        return res.status(500).json({ 
            success: false, 
            error: error.message || "Failed to delete PCM class"
        });
    }
};

