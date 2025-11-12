import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  createBlog,
  getAllBlogsAdmin,
  getPublishedBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  searchBlogs
} from '../../Controllers/Blog/BlogController.js';

// Use existing authentication middleware
import { verifyToken } from '../../Middleware/authMiddleware.js';
import verifyBlogAdmin from '../../Middleware/blogAuthMiddleware.js';

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../../public/uploads/blogs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'blog-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// NOTE: Blog admin routes use existing admin authentication
// Admins login through the main /adminlogin route
// The verifyToken middleware handles JWT authentication and attaches req.user
// The verifyBlogAdmin middleware only checks if user.role is 'Admin'

// Admin Blog Management Routes (Protected - requires existing admin login)
router.post('/admin/create', verifyToken, verifyBlogAdmin, createBlog);
router.get('/admin/all', getAllBlogsAdmin); // Made public as requested
router.put('/admin/update/:id', verifyToken, verifyBlogAdmin, updateBlog);
router.delete('/admin/delete/:id', verifyToken, verifyBlogAdmin, deleteBlog);

// Debug endpoint to test authentication
router.get('/admin/test-auth', verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'Authentication working',
    user: req.user
  });
});

// Public Blog Routes
router.get('/published', getPublishedBlogs);
router.get('/search', searchBlogs);
router.get('/:id', getBlogById);

export default router;
