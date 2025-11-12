import Blog from '../../Models/Blog/BlogModel.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Create a new blog
// @route   POST /api/blog/admin/create
// @access  Private (Admin)
const createBlog = async (req, res) => {
  try {
    const { title, excerpt, content, author, tags, published, image } = req.body;

    // Parse tags if it's a string
    let parsedTags = tags;
    if (typeof tags === 'string') {
      parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    const blogData = {
      title,
      excerpt,
      content,
      author: author || 'Admin',
      tags: parsedTags || [],
      published: published === 'true' || published === true
    };

    // Handle Base64 image
    if (image && image.startsWith('data:image/')) {
      blogData.image = image; // Store Base64 string directly
    }

    const blog = await Blog.create(blogData);

    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: blog
    });
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating blog',
      error: error.message
    });
  }
};

// @desc    Get all blogs (admin can see unpublished)
// @route   GET /api/blog/admin/all
// @access  Private (Admin)
const getAllBlogsAdmin = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs
    });
  } catch (error) {
    console.error('Get all blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blogs',
      error: error.message
    });
  }
};

// @desc    Get all published blogs (public)
// @route   GET /api/blog/published
// @access  Public
const getPublishedBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ published: true }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs
    });
  } catch (error) {
    console.error('Get published blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching published blogs',
      error: error.message
    });
  }
};

// @desc    Get single blog by ID
// @route   GET /api/blog/:id
// @access  Public
const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Get blog by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blog',
      error: error.message
    });
  }
};

// @desc    Update blog
// @route   PUT /api/blog/admin/update/:id
// @access  Private (Admin)
const updateBlog = async (req, res) => {
  try {
    const { title, excerpt, content, author, tags, published, image } = req.body;
    
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Parse tags if it's a string
    let parsedTags = tags;
    if (typeof tags === 'string') {
      parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    // Update fields
    if (title) blog.title = title;
    if (excerpt) blog.excerpt = excerpt;
    if (content) blog.content = content;
    if (author) blog.author = author;
    if (parsedTags) blog.tags = parsedTags;
    if (published !== undefined) {
      blog.published = published === 'true' || published === true;
    }

    // Handle Base64 image
    if (image) {
      if (image.startsWith('data:image/')) {
        blog.image = image; // Store Base64 string directly
      } else if (image === '') {
        blog.image = ''; // Clear image
      }
    }

    const updatedBlog = await blog.save();

    res.status(200).json({
      success: true,
      message: 'Blog updated successfully',
      data: updatedBlog
    });
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating blog',
      error: error.message
    });
  }
};

// @desc    Delete blog
// @route   DELETE /api/blog/admin/delete/:id
// @access  Private (Admin)
const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // No need to delete files since we're using Base64 images
    await Blog.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting blog',
      error: error.message
    });
  }
};

// @desc    Search blogs by tag or keyword
// @route   GET /api/blog/search?q=keyword&tag=tagname
// @access  Public
const searchBlogs = async (req, res) => {
  try {
    const { q, tag } = req.query;
    let query = { published: true };

    if (tag) {
      query.tags = { $in: [tag] };
    }

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { excerpt: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } }
      ];
    }

    const blogs = await Blog.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs
    });
  } catch (error) {
    console.error('Search blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching blogs',
      error: error.message
    });
  }
};

export {
  createBlog,
  getAllBlogsAdmin,
  getPublishedBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  searchBlogs
};
