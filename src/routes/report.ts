import express from 'express';
import Report from '../models/Report.js';

const router = express.Router();

// Submit project report
router.post('/', async (req: any, res: any) => {
  try {
    const { 
      title, 
      description, 
      reporterName, 
      reporterEmail, 
      category, 
      projectUrl 
    } = req.body;

    const report = new Report({
      title,
      description,
      reporterName,
      reporterEmail,
      category,
      projectUrl
    });

    await report.save();

    res.json({
      success: true,
      message: 'Project submitted successfully! Our team will review it and get back to you soon.'
    });
  } catch (error) {
    console.error('Project submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit project'
    });
  }
});

export default router;
