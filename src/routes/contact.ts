import express from 'express';
import Contact from '../models/Contact.js';

const router = express.Router();

// Submit contact form
router.post('/', async (req: any, res: any) => {
  try {
    const { name, email, subject, message } = req.body;

    const contact = new Contact({
      name,
      email,
      subject,
      message
    });

    await contact.save();

    res.json({
      success: true,
      message: 'Thank you for your message! We will get back to you soon.'
    });
  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit message'
    });
  }
});

export default router;
