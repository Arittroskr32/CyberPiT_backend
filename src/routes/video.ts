import express from 'express';
import Video from '../models/Video.js';

const router = express.Router();

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
        desktop: desktopVideo ? `/video/${desktopVideo.filename}` : '/video/pc_video.mp4',
        mobile: mobileVideo ? `/video/${mobileVideo.filename}` : '/video/mobile_video.mp4'
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

export default router;
