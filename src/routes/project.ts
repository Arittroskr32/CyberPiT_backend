import express from 'express';
import Project from '../models/Project.js';

const router = express.Router();

// Get all projects
router.get('/', async (req: any, res: any) => {
  try {
    const projects = await Project.find({ status: { $ne: 'archived' } })
      .sort({ featured: -1, createdAt: -1 });

    res.json({
      success: true,
      projects
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects'
    });
  }
});

// Get featured projects
router.get('/featured', async (req: any, res: any) => {
  try {
    const projects = await Project.find({ 
      featured: true, 
      status: { $ne: 'archived' } 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      projects
    });
  } catch (error) {
    console.error('Get featured projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured projects'
    });
  }
});

export default router;
