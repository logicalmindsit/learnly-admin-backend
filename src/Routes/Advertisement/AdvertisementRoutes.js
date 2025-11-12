import express from 'express';
import multer from 'multer'; // 1. Import multer for file uploads
import path from 'path';     // 2. Import path for handling file extensions
import Advertisement from '../../Models/Advertisement/AdvertisementModel.js';
import { verifyToken } from '../../Middleware/authMiddleware.js';

const router = express.Router();

// --- Multer Configuration for saving the uploaded image ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // IMPORTANT: Make sure the 'public/uploads/ads' folder exists in your backend directory
        cb(null, 'public/uploads/ads'); 
    },
    filename: (req, file, cb) => {
        // Creates a unique filename to prevent conflicts, e.g., ad-1692513367123.png
        cb(null, `ad-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({ storage: storage });
// -----------------------------------------------------------


/**
 * @route   POST /api/advertisements/create
 * @desc    Create a new advertisement. This will deactivate all other ads.
 * @access  Private (Admin)
 */
// 3. Add multer middleware 'upload.single()' to handle the file
router.post('/create', verifyToken, upload.single('adImage'), async (req, res) => { 
    try {
        const { targetUrl, title } = req.body;
        
        // 4. Validate file upload and target URL
        if (!req.file) {
            return res.status(400).json({ error: 'Advertisement image is required.' });
        }
        if (!targetUrl) {
            return res.status(400).json({ error: 'Target URL is required.' });
        }

        // 5. Deactivate all existing advertisements
        await Advertisement.updateMany({}, { is_active: false });

        // 6. Create the new advertisement and set it to active
        const newAdvertisement = new Advertisement({
            title: title,
            target_url: targetUrl,
            image_path: `/uploads/ads/${req.file.filename}`, // Save the public path to the image
            is_active: true,
        });

        await newAdvertisement.save();
        
        // Return the newly created advertisement object, just like in your announcement route
        res.status(201).json(newAdvertisement); 

    } catch (error) {
        console.error('Error creating advertisement:', error);
        res.status(500).json({ error: 'Server error while creating advertisement.' });
    }
});


/**
 * @route   GET /api/advertisements/active
 * @desc    Get the single currently active advertisement (for users)
 * @access  Public
 */
// This replaces the '/latest' route. Users only need to see the one that is active.
router.get('/active', async (req, res) => {
    try {
        const activeAd = await Advertisement.findOne({ is_active: true });
        
        // It's okay if no ad is found, just return null. The frontend will handle it.
        if (!activeAd) {
            return res.status(200).json(null);
        }
        
        res.status(200).json(activeAd);

    } catch (error) {        
        console.error('Error fetching active advertisement:', error);
        res.status(500).json({ error: 'Server error while fetching advertisement.' });
    }
});


/**
 * @route   GET /api/advertisements/all
 * @desc    Get all advertisements (for the admin panel history)
 * @access  Private (Admin)
 */
// This route is the same as your announcement '/all' route.
router.get('/all', verifyToken, async (req, res) => {
    try {
        const allAdvertisements = await Advertisement.find({}).sort({ createdAt: -1 });
        res.status(200).json(allAdvertisements);
    } catch (error) {
        console.error('Error fetching all advertisements:', error);
        res.status(500).json({ error: 'Server error while fetching announcements.' });
    }
});

export default router;