import express, { Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import jwt from 'jsonwebtoken';
import Blog from '../models/Blog';
import Admin from '../models/Admin';

const router = express.Router();

// Middleware to verify admin token
const verifyAdmin = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    const admin = await Admin.findById(decoded.adminId);

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Helper function to calculate read time
const calculateReadTime = (content: string): number => {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};

// Public routes - Get all published blogs with search and filter
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 9;
    const search = req.query.search as string;
    const category = req.query.category as string;
    const featured = req.query.featured === 'true';

    let query: any = { isPublished: true };

    // Add search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Add category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Add featured filter
    if (featured) {
      query.isFeatured = true;
    }

    const skip = (page - 1) * limit;

    let sortOptions: any = { createdAt: -1 };
    if (search) {
      sortOptions = { score: { $meta: 'textScore' }, createdAt: -1 };
    }

    const blogs = await Blog.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // Truncate content for preview
    const blogsWithPreview = blogs.map(blog => ({
      ...blog.toObject(),
      content: blog.content.substring(0, 150) + (blog.content.length > 150 ? '...' : '')
    }));

    const total = await Blog.countDocuments(query);

    res.json({
      success: true,
      blogs: blogsWithPreview,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blogs'
    });
  }
});

// Get single blog by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const blog = await Blog.findOne({ 
      _id: req.params.id, 
      isPublished: true 
    });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Increment view count
    blog.views += 1;
    await blog.save();

    res.json({
      success: true,
      blog
    });
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog'
    });
  }
});

// Get featured blogs
router.get('/featured/list', async (req: Request, res: Response) => {
  try {
    const blogs = await Blog.find({ 
      isPublished: true, 
      isFeatured: true 
    })
    .sort({ createdAt: -1 })
    .limit(3);

    // Truncate content for preview
    const blogsWithPreview = blogs.map(blog => ({
      ...blog.toObject(),
      content: blog.content.substring(0, 150) + (blog.content.length > 150 ? '...' : '')
    }));

    res.json({
      success: true,
      blogs: blogsWithPreview
    });
  } catch (error) {
    console.error('Error fetching featured blogs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured blogs'
    });
  }
});

// Get blog categories
router.get('/categories/list', async (req: Request, res: Response) => {
  try {
    const categories = await Blog.distinct('category', { isPublished: true });
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

// Admin routes (protected)
// Get all blogs for admin
router.get('/admin/all', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    // Build search query if search term is provided
    let query: any = {};
    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { author: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ]
      };
    }

    console.log('📡 Admin blog query:', query);
    console.log('📡 Pagination params:', { page, limit, skip });

    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Truncate content for preview in admin list
    const blogsWithPreview = blogs.map(blog => ({
      ...blog.toObject(),
      content: blog.content.substring(0, 150) + (blog.content.length > 150 ? '...' : '')
    }));

    const total = await Blog.countDocuments(query);

    console.log('✅ Admin blogs fetched:', blogsWithPreview.length, 'total:', total);

    res.json({
      success: true,
      blogs: blogsWithPreview,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('❌ Error fetching admin blogs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blogs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create new blog
router.post('/admin/create', verifyAdmin, async (req: Request, res: Response) => {
  try {
    console.log('📝 Creating new blog with data:', req.body);
    
    const {
      title,
      content,
      author,
      category,
      tags,
      imageUrl,
      blogUrl,
      isPublished,
      isFeatured
    } = req.body;

    // Validate required fields
    if (!title || !content || !author || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, content, author, and category are required'
      });
    }

    const readTime = calculateReadTime(content);

    // Handle tags - could be string or array
    let processedTags: string[] = [];
    if (tags) {
      if (typeof tags === 'string') {
        processedTags = tags.split(',').map((tag: string) => tag.trim()).filter(tag => tag);
      } else if (Array.isArray(tags)) {
        processedTags = tags.map((tag: string) => tag.trim()).filter(tag => tag);
      }
    }

    console.log('📝 Processed blog data:', {
      title,
      author,
      category,
      tags: processedTags,
      contentLength: content.length,
      readTime,
      isPublished: isPublished || false,
      isFeatured: isFeatured || false
    });

    const blog = new Blog({
      title,
      content,
      author,
      category,
      tags: processedTags,
      imageUrl,
      blogUrl,
      isPublished: isPublished || false,
      isFeatured: isFeatured || false,
      readTime
    });

    await blog.save();
    console.log('✅ Blog created successfully with ID:', blog._id);

    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      blog
    });
  } catch (error) {
    console.error('❌ Error creating blog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create blog',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Upload blog image
router.post('/admin/upload-image', verifyAdmin, upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    console.log('📸 Uploading blog image to Cloudinary...');

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'cyberpit-blogs',
          transformation: [
            { width: 800, height: 400, crop: 'fill', quality: 'auto' },
            { format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file!.buffer);
    });

    const uploadResult = result as any;

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id
    });
  } catch (error) {
    console.error('❌ Error uploading blog image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image'
    });
  }
});

// Get single blog for editing
router.get('/admin/:id', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    res.json({
      success: true,
      blog
    });
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog'
    });
  }
});

// Update blog
router.put('/admin/:id', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const {
      title,
      content,
      author,
      category,
      tags,
      imageUrl,
      blogUrl,
      isPublished,
      isFeatured
    } = req.body;

    const readTime = calculateReadTime(content);

    // Handle tags - could be string or array
    let processedTags: string[] = [];
    if (tags) {
      if (typeof tags === 'string') {
        processedTags = tags.split(',').map((tag: string) => tag.trim()).filter(tag => tag);
      } else if (Array.isArray(tags)) {
        processedTags = tags.map((tag: string) => tag.trim()).filter(tag => tag);
      }
    }

    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      {
        title,
        content,
        author,
        category,
        tags: processedTags,
        imageUrl,
        blogUrl,
        isPublished,
        isFeatured,
        readTime
      },
      { new: true }
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    res.json({
      success: true,
      message: 'Blog updated successfully',
      blog
    });
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update blog'
    });
  }
});

// Delete blog
router.delete('/admin/:id', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Delete image from Cloudinary if exists
    if (blog.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(blog.imagePublicId);
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
      }
    }

    await Blog.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete blog'
    });
  }
});

// Toggle blog like
router.post('/:id/like', async (req: Request, res: Response) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    blog.likes += 1;
    await blog.save();

    res.json({
      success: true,
      likes: blog.likes
    });
  } catch (error) {
    console.error('Error liking blog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like blog'
    });
  }
});

export default router;
