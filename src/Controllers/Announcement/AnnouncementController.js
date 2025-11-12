// File: backend/src/Controllers/Admin/Announcement/AnnouncementController.js
import Announcement from '../../Models/Announcement/AnnouncementModel.js';

export const createAnnouncement = async (req, res) => {
    try {
       
        const { title, content, button_text, button_url } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required.' });
        }

        // If a file was uploaded via multer, req.file will exist.
        // We store a public path to the file so frontend can load it via /uploads
        let image_path = '';
        if (req.file && req.file.filename) {
            image_path = `/uploads/announcements/${req.file.filename}`;
        }

        const newAnnouncement = new Announcement({
            title,
            content,
            button_text, 
            button_url,
            image_path
        });

        const savedAnnouncement = await newAnnouncement.save();
        res.status(201).json(savedAnnouncement);

    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ message: 'Server error while creating announcement.' });
    }
};


export const getLatestAnnouncement = async (req, res) => {
    try {
        const latestAnnouncement = await Announcement.findOne().sort({ createdAt: -1 });
        
        if (!latestAnnouncement) {
            return res.status(200).json(null);
        }
        
        res.status(200).json(latestAnnouncement);

    } catch (error) {
        console.error('Error fetching latest announcement:', error);
        res.status(500).json({ message: 'Server error while fetching announcement.' });
    }
};


export const getAllAnnouncements = async (req, res) => {
    try {
        const allAnnouncements = await Announcement.find({}).sort({ createdAt: -1 });
        res.status(200).json(allAnnouncements);

    } catch (error) {
        console.error('Error fetching all announcements:', error);
        res.status(500).json({ message: 'Server error while fetching announcements.' });
    }
};