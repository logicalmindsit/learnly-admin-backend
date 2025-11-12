// File: src/Models/Advertisement/AdvertisementModel.js

// BEFORE (Wrong): const mongoose = require('mongoose');
// AFTER (Correct):
import mongoose from 'mongoose';

const AdvertisementSchema = new mongoose.Schema({
    image_path: {
        type: String,
        required: true,
    },
     title: {
        type: String,
        required: false, // The title is optional
    },
    target_url: {
        type: String,
        required: true,
    },
    is_active: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

const Advertisement = mongoose.model('Advertisement', AdvertisementSchema);

// BEFORE (Wrong): module.exports = Advertisement;
// AFTER (Correct):
export default Advertisement;