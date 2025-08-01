import express from 'express';
import Feedback from '../models/Feedback.js';

const router = express.Router();

// Get all feedback/testimonials (for frontend filtering)
router.get('/', async (req: any, res: any) => {
  try {
    const feedback = await Feedback.find({}).sort({ featured: -1, createdAt: -1 });

    res.json({
      success: true,
      feedback
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback'
    });
  }
});

// Submit new feedback
router.post('/', async (req: any, res: any) => {
  try {
    const { name, email, role, workplace, comment, rating } = req.body;

    const feedback = new Feedback({
      name,
      email,
      role,
      workplace,
      comment,
      rating
    });

    await feedback.save();

    res.json({
      success: true,
      message: 'Thank you for your feedback! It will be reviewed before being published.'
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback'
    });
  }
});

export default router;
