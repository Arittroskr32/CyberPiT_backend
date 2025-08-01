import express from 'express';
import TeamApplication from '../models/TeamApplication.js';

const router = express.Router();

// Submit team application
router.post('/apply', async (req: any, res: any) => {
  try {
    const { name, email, phone, linkedin, interest, comment } = req.body;

    const application = new TeamApplication({
      name,
      email,
      phone,
      linkedin,
      interest,
      comment
    });

    await application.save();

    res.json({
      success: true,
      message: 'Your application has been submitted successfully! We will review it and get back to you.'
    });
  } catch (error) {
    console.error('Team application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application'
    });
  }
});

export default router;
