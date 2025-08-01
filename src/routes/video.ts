import express from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import Video from '../models/Video.js';
import Admin from '../models/Admin.js';

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

// Configure multer for memory storage (temporary)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

// Get current video sources
router.get('/current', async (req: any, res: any) => {
  try {
    const desktopVideo = await Video.findOne({ 
      type: 'desktop', 
      isActive: true 
    }).sort({ createdAt: -1 });
    
    const mobileVideo = await Video.findOne({ 
      type: 'mobile', 
      isActive: true 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      videos: {
        desktop: desktopVideo ? (desktopVideo.cloudinaryUrl || `/video/${desktopVideo.filename}`) : '/video/pc_video.mp4',
        mobile: mobileVideo ? (mobileVideo.cloudinaryUrl || `/video/${mobileVideo.filename}`) : '/video/mobile_video.mp4'
      }
    });
  } catch (error) {
    console.error('Get videos error:', error);
    res.json({
      success: true,
      videos: {
        desktop: '/video/pc_video.mp4',
        mobile: '/video/mobile_video.mp4'
      }
    });
  }
});

// Admin: Get all videos
router.get('/admin/all', verifyAdmin, async (req: any, res: any) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      videos: videos.map(video => ({
        _id: video._id,
        name: video.name,
        type: video.type,
        originalName: video.originalName,
        size: video.size,
        mimeType: video.mimeType,
        isActive: video.isActive,
        url: video.cloudinaryUrl || `/video/${video.filename}`,
        createdAt: video.createdAt,
      }))
    });
  } catch (error) {
    console.error('Get all videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch videos'
    });
  }
});

// Admin: Upload new video
router.post('/admin/upload', verifyAdmin, upload.single('video'), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file provided'
      });
    }

    const { name, type } = req.body;
    
    if (!name || !type || !['desktop', 'mobile'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid video name or type'
      });
    }

    console.log('🎥 Uploading video to Cloudinary...');
    console.log('📁 File size:', req.file.size, 'bytes');
    console.log('📁 File type:', req.file.mimetype);

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: 'cyberpit-videos',
          public_id: `${type}_${Date.now()}`,
          quality: 'auto',
          format: 'mp4',
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('✅ Cloudinary upload success:', result?.secure_url);
            resolve(result);
          }
        }
      );
      
      uploadStream.end(req.file.buffer);
    });

    const result = uploadResult as any;

    // Deactivate previous videos of the same type
    await Video.updateMany(
      { type, isActive: true },
      { $set: { isActive: false } }
    );

    // Save video info to database
    const video = new Video({
      name,
      type,
      filename: result.public_id,
      originalName: req.file.originalname,
      path: result.secure_url,
      size: req.file.size,
      mimeType: req.file.mimetype,
      cloudinaryUrl: result.secure_url,
      cloudinaryPublicId: result.public_id,
      isActive: true,
    });

    await video.save();

    res.json({
      success: true,
      message: 'Video uploaded successfully',
      video: {
        _id: video._id,
        name: video.name,
        type: video.type,
        url: video.cloudinaryUrl,
        isActive: video.isActive,
        createdAt: video.createdAt,
      }
    });

  } catch (error) {
    console.error('❌ Video upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Video upload failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Admin: Delete video
router.delete('/admin/:id', verifyAdmin, async (req: any, res: any) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Delete from Cloudinary if it exists
    if (video.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(video.cloudinaryPublicId, {
          resource_type: 'video'
        });
        console.log('✅ Video deleted from Cloudinary:', video.cloudinaryPublicId);
      } catch (cloudinaryError) {
        console.error('❌ Cloudinary deletion error:', cloudinaryError);
        // Continue with database deletion even if Cloudinary fails
      }
    }

    // Delete from database
    await Video.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });

  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete video'
    });
  }
});

// Admin: Toggle video active status
router.patch('/admin/:id/toggle', verifyAdmin, async (req: any, res: any) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // If activating this video, deactivate others of the same type
    if (!video.isActive) {
      await Video.updateMany(
        { type: video.type, isActive: true },
        { $set: { isActive: false } }
      );
    }

    video.isActive = !video.isActive;
    await video.save();

    res.json({
      success: true,
      message: `Video ${video.isActive ? 'activated' : 'deactivated'} successfully`,
      video: {
        _id: video._id,
        name: video.name,
        type: video.type,
        isActive: video.isActive,
      }
    });

  } catch (error) {
    console.error('Toggle video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle video status'
    });
  }
});

export default router;
