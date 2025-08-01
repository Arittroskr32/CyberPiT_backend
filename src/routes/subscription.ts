import express from 'express';
import Subscription from '../models/Subscription.js';

const router = express.Router();

// Subscribe to newsletter
router.post('/', async (req: any, res: any) => {
  try {
    const { email } = req.body;

    // Check if already subscribed
    const existing = await Subscription.findOne({ email });
    if (existing) {
      if (existing.isActive) {
        return res.json({
          success: true,
          message: 'You are already subscribed!'
        });
      } else {
        existing.isActive = true;
        await existing.save();
        return res.json({
          success: true,
          message: 'Welcome back! You have been resubscribed.'
        });
      }
    }

    const subscription = new Subscription({ email });
    await subscription.save();

    res.json({
      success: true,
      message: 'Thank you for subscribing!'
    });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe'
    });
  }
});

export default router;
