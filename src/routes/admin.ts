import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Admin from '../models/Admin.js';
import Contact from '../models/Contact.js';
import Subscription from '../models/Subscription.js';
import TeamApplication from '../models/TeamApplication.js';
import TeamMember from '../models/TeamMember.js';
import Project from '../models/Project.js';
import Report from '../models/Report.js';
import Video from '../models/Video.js';
import Feedback from '../models/Feedback.js';
import { sendBulkEmail } from '../services/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Admin-only login route (separate from regular auth)
router.post('/only_admin/login', async (req: any, res: any) => {
  try {
    const { email, password } = req.body;

    console.log('🔍 Login attempt:', { email, password: '***' });

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check if admin exists and is active
    const admin = await Admin.findOne({ 
      email: email.toLowerCase().trim(), 
      isActive: true 
    });

    console.log('👤 Admin found:', admin ? { email: admin.email, role: admin.role, isActive: admin.isActive } : 'None');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    console.log('🔐 Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Check if user has admin role
    if (admin.role !== 'admin' && admin.role !== 'super-admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token with admin-specific claims
    const tokenPayload = {
      adminId: admin._id,
      email: admin.email,
      role: admin.role,
      type: 'admin_only'
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        lastLogin: admin.lastLogin
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during admin login'
    });
  }
});

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

// Dashboard statistics
router.get('/dashboard', verifyAdmin, async (req: any, res: any) => {
  try {
    const stats = {
      contacts: await Contact.countDocuments(),
      unreadContacts: await Contact.countDocuments({ status: 'unread' }),
      subscriptions: await Subscription.countDocuments({ isActive: true }),
      teamApplications: await TeamApplication.countDocuments(),
      pendingApplications: await TeamApplication.countDocuments({ status: 'pending' }),
      teamMembers: await TeamMember.countDocuments({ isActive: true }),
      projects: await Project.countDocuments({ status: { $ne: 'archived' } }),
      reports: await Report.countDocuments(),
      newReports: await Report.countDocuments({ status: 'new' }),
      feedback: await Feedback.countDocuments(),
      pendingFeedback: await Feedback.countDocuments({ approved: false }),
      videos: await Video.countDocuments({ isActive: true })
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
});

// Contact management
router.get('/contacts', verifyAdmin, async (req: any, res: any) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({ success: true, contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch contacts' });
  }
});

router.patch('/contacts/:id', verifyAdmin, async (req: any, res: any) => {
  try {
    const { status, adminResponse } = req.body;
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status, adminResponse },
      { new: true }
    );
    res.json({ success: true, contact });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update contact' });
  }
});

router.delete('/contacts/:id', verifyAdmin, async (req: any, res: any) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Contact deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete contact' });
  }
});

// Clear all contacts
router.delete('/contacts', verifyAdmin, async (req: any, res: any) => {
  try {
    await Contact.deleteMany({});
    res.json({ success: true, message: 'All contacts cleared successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to clear contacts' });
  }
});

// Subscription management
router.get('/subscriptions', verifyAdmin, async (req: any, res: any) => {
  try {
    const subscriptions = await Subscription.find().sort({ createdAt: -1 });
    res.json({ success: true, subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch subscriptions' });
  }
});

router.patch('/subscriptions/:id', verifyAdmin, async (req: any, res: any) => {
  try {
    const { isActive } = req.body;
    const subscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );
    res.json({ success: true, subscription });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update subscription' });
  }
});

router.delete('/subscriptions/:id', verifyAdmin, async (req: any, res: any) => {
  try {
    await Subscription.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Subscription deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete subscription' });
  }
});

router.delete('/subscriptions/batch', verifyAdmin, async (req: any, res: any) => {
  try {
    const { ids } = req.body;
    await Subscription.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `${ids.length} subscriptions deleted successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete subscriptions' });
  }
});

// Bulk email route
router.post('/subscriptions/bulk-email', verifyAdmin, async (req: any, res: any) => {
  try {
    const { subject, body } = req.body;

    if (!subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'Subject and body are required'
      });
    }

    // Get all active subscribers
    const activeSubscriptions = await Subscription.find({ isActive: true });
    const subscriberEmails = activeSubscriptions.map(sub => sub.email);

    if (subscriberEmails.length === 0) {
      return res.json({
        success: false,
        message: 'No active subscribers found'
      });
    }

    console.log(`📧 Starting bulk email to ${subscriberEmails.length} subscribers`);
    console.log(`📝 Subject: ${subject}`);

    // Send bulk email using the email service
    const result = await sendBulkEmail(subscriberEmails, { subject, body });

    if (result.success) {
      res.json({
        success: true,
        message: `Email sent successfully to ${result.sent} subscribers`,
        details: {
          sent: result.sent,
          failed: result.failed,
          total: subscriberEmails.length
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send some emails',
        details: {
          sent: result.sent,
          failed: result.failed,
          total: subscriberEmails.length,
          errors: result.errors.slice(0, 5) // Limit errors shown
        }
      });
    }
  } catch (error: any) {
    console.error('Bulk email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk email',
      error: error.message
    });
  }
});

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Navigate from server/src/routes/ to public/video/
    const uploadPath = path.resolve(__dirname, '../../../public/video');
    console.log('📁 Upload destination:', uploadPath);
    
    // Ensure the directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log('✅ Created upload directory:', uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    console.log('📄 Original filename:', file.originalname);
    console.log('📝 Request body in multer:', req.body);
    
    // Use a temporary filename first, we'll rename it in the upload route
    const tempFilename = `temp_${Date.now()}_${file.originalname}`;
    console.log('💾 Temporary filename:', tempFilename);
    cb(null, tempFilename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '157286400') // 150MB default
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// Video management routes
router.get('/videos', verifyAdmin, async (req: any, res: any) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.json({ success: true, videos });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch videos' });
  }
});

router.post('/videos/upload', verifyAdmin, upload.single('video'), async (req: any, res: any) => {
  try {
    const { type, name } = req.body;
    
    console.log('🎬 Video upload request:', { type, name });
    console.log('📁 File details:', req.file ? {
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path,
      size: req.file.size
    } : 'No file');
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No video file provided' });
    }

    if (!type || !['mobile', 'desktop'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid video type' });
    }

    // Determine the correct filename based on type
    const correctFilename = type === 'mobile' ? 'mobile_video.mp4' : 'pc_video.mp4';
    const uploadDir = path.dirname(req.file.path);
    const correctPath = path.join(uploadDir, correctFilename);
    
    console.log('🔄 Renaming file from:', req.file.path);
    console.log('🔄 Renaming file to:', correctPath);

    // Delete existing file with the same name if it exists
    if (fs.existsSync(correctPath)) {
      fs.unlinkSync(correctPath);
      console.log('🗑️ Deleted existing file:', correctPath);
    }

    // Rename the uploaded file to the correct name
    fs.renameSync(req.file.path, correctPath);
    console.log('✅ File renamed successfully');

    // Update file object with correct path and filename
    req.file.path = correctPath;
    req.file.filename = correctFilename;

    // Delete previous videos of the same type from database
    const previousVideos = await Video.find({ type, isActive: true });
    for (const prevVideo of previousVideos) {
      // Delete old database records (files are already handled above)
      console.log('🗑️ Deactivating previous video record:', prevVideo.filename);
    }
    
    // Deactivate previous videos of the same type
    await Video.updateMany({ type, isActive: true }, { isActive: false });

    // Create new video record
    const video = new Video({
      name: name || `${type} Video`,
      type,
      filename: correctFilename,
      originalName: req.file.originalname,
      path: correctPath,
      size: req.file.size,
      mimeType: req.file.mimetype,
      isActive: true
    });

    await video.save();

    console.log(`✅ Video uploaded successfully: ${correctFilename} -> ${correctPath}`);

    res.json({ 
      success: true, 
      message: `${type} video uploaded successfully`,
      video 
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload video' });
  }
});

router.delete('/videos/:id', verifyAdmin, async (req: any, res: any) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    // Delete file from filesystem
    try {
      if (fs.existsSync(video.path)) {
        fs.unlinkSync(video.path);
      }
    } catch (fileError) {
      console.error('Error deleting video file:', fileError);
    }

    // Delete from database
    await Video.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete video' });
  }
});

// Feedback management routes
router.get('/feedback', async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json({ success: true, feedbacks });
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/feedback', async (req, res) => {
  try {
    const { name, email, role, workplace, comment, rating, isFeatured = false } = req.body;
    const feedback = new Feedback({ name, email, role, workplace, comment, rating, isFeatured });
    await feedback.save();
    res.json({ success: true, feedback });
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.patch('/feedback/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const feedback = await Feedback.findByIdAndUpdate(id, updates, { new: true });
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }
    
    res.json({ success: true, feedback });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/feedback/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findByIdAndDelete(id);
    
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }
    
    res.json({ success: true, message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// One-time setup: Add default feedback entries
router.post('/setup-default-feedback', async (req, res) => {
  try {
    // Check if default feedback already exists
    const existingFeedback = await Feedback.find({ 
      name: { $in: ['John Doe', 'Jane Smith', 'Mike Johnson'] } 
    });
    
    const defaultFeedbacks = [
      {
        name: "John Doe",
        email: "john.doe@demo.com",
        role: "Security Analyst",
        workplace: "TechCorp Inc.",
        comment: "CyberPiT has significantly improved our security posture. The tools and insights provided are invaluable for our daily operations.",
        rating: 5,
        featured: true
      },
      {
        name: "Jane Smith",
        email: "jane.smith@demo.com", 
        role: "IT Manager",
        workplace: "SecureNet Solutions",
        comment: "The comprehensive approach to cybersecurity education and practical tools makes CyberPiT a must-have resource.",
        rating: 5,
        featured: true
      },
      {
        name: "Mike Johnson",
        email: "mike.johnson@demo.com",
        role: "Penetration Tester",
        workplace: "CyberGuard LLC",
        comment: "Outstanding platform for staying updated with the latest security trends and techniques.",
        rating: 5,
        featured: true
      }
    ];

    let createdCount = 0;
    const createdFeedbacks = [];

    // Insert only feedback that doesn't exist
    for (const feedback of defaultFeedbacks) {
      const exists = await Feedback.findOne({ name: feedback.name });
      if (!exists) {
        const created = await Feedback.create(feedback);
        createdFeedbacks.push(created);
        createdCount++;
      }
    }
    
    res.json({ 
      success: true, 
      message: `Setup completed! Created ${createdCount} new feedback entries.`,
      createdCount: createdCount,
      existingCount: existingFeedback.length,
      feedbacks: createdFeedbacks
    });
  } catch (error) {
    console.error('Error creating default feedback:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add testimonials from EditFeedback component as community feedback
router.post('/setup-testimonials-feedback', async (req, res) => {
  try {
    const testimonialFeedbacks = [
      {
        name: "Alex Chen",
        email: "alex.chen@demo.com",
        role: "Security Engineer",
        workplace: "TechCorp",
        comment: "CyberPiT's workshop on binary exploitation completely changed how I approach security testing. Their techniques are cutting-edge.",
        rating: 5,
        featured: false
      },
      {
        name: "Sarah Johnson",
        email: "sarah.johnson@demo.com", 
        role: "CISO",
        workplace: "FinSecure",
        comment: "We hired CyberPiT for a red team assessment and they found critical vulnerabilities that our regular audits missed. Highly recommended.",
        rating: 5,
        featured: false
      },
      {
        name: "Marcus Williams",
        email: "marcus.williams@demo.com",
        role: "CTF Competitor",
        workplace: "CTF Team",
        comment: "The tools CyberPiT has released to the community have been invaluable for our CTF team. Their approach is both practical and innovative.",
        rating: 4,
        featured: false
      }
    ];

    let createdCount = 0;
    const createdFeedbacks = [];

    // Insert only feedback that doesn't exist
    for (const feedback of testimonialFeedbacks) {
      const exists = await Feedback.findOne({ name: feedback.name });
      if (!exists) {
        const created = await Feedback.create(feedback);
        createdFeedbacks.push(created);
        createdCount++;
      }
    }
    
    res.json({ 
      success: true, 
      message: `Testimonials setup completed! Created ${createdCount} new testimonial feedback entries.`,
      createdCount: createdCount,
      feedbacks: createdFeedbacks
    });
  } catch (error) {
    console.error('Error creating testimonial feedback:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Team Management Routes
// Get all team members
router.get('/team', async (req, res) => {
  try {
    const teamMembers = await TeamMember.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
    res.json({ success: true, data: teamMembers });
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add a new team member
router.post('/team', verifyAdmin, async (req, res) => {
  try {
    const { name, role, image, bio, order } = req.body;
    
    const teamMember = new TeamMember({
      name,
      role,
      image,
      bio,
      order: order || 0
    });
    
    await teamMember.save();
    res.json({ success: true, data: teamMember });
  } catch (error) {
    console.error('Error creating team member:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update a team member
router.patch('/team/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const teamMember = await TeamMember.findByIdAndUpdate(id, updates, { new: true });
    if (!teamMember) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }
    
    res.json({ success: true, data: teamMember });
  } catch (error) {
    console.error('Error updating team member:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete a team member
router.delete('/team/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await TeamMember.findByIdAndDelete(id);
    res.json({ success: true, message: 'Team member deleted successfully' });
  } catch (error) {
    console.error('Error deleting team member:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Setup default team members
router.post('/setup-default-team', async (req, res) => {
  try {
    // Check if team members already exist
    const existingCount = await TeamMember.countDocuments();
    if (existingCount > 0) {
      return res.json({ 
        success: true, 
        message: `Team already has ${existingCount} members. Skipping setup.` 
      });
    }

    const defaultTeamMembers = [
      {
        name: 'Alex Rivera',
        role: 'Founder & Exploit Developer',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
        bio: 'Former black hat with 15 years of experience in vulnerability research. Specializes in kernel exploitation and low-level security.',
        order: 1
      },
      {
        name: 'Mia Johnson',
        role: 'Reverse Engineer',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
        bio: 'Specializes in firmware analysis and embedded systems security. Has discovered critical vulnerabilities in IoT devices from major manufacturers.',
        order: 2
      },
      {
        name: 'Raj Patel',
        role: 'Web Security Specialist',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
        bio: 'Expert in web application security and API vulnerabilities. Regular contributor to bug bounty programs with over 200 valid submissions.',
        order: 3
      },
      {
        name: 'Sophie Chen',
        role: 'Cryptography Expert',
        image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=922&q=80',
        bio: 'PhD in Applied Mathematics with a focus on cryptographic implementations. Has identified weaknesses in several widely-used encryption protocols.',
        order: 4
      },
      {
        name: 'Marcus Wilson',
        role: 'Red Team Lead',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
        bio: 'Former military intelligence with expertise in physical security and social engineering. Leads our comprehensive red team operations.',
        order: 5
      },
      {
        name: 'Elena Rodriguez',
        role: 'Malware Analyst',
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=776&q=80',
        bio: 'Specializes in reverse engineering malware and tracking threat actors. Has published research on several APT campaigns and nation-state threats.',
        order: 6
      }
    ];

    await TeamMember.insertMany(defaultTeamMembers);
    
    res.json({
      success: true,
      message: `Successfully created ${defaultTeamMembers.length} default team members`
    });
  } catch (error) {
    console.error('Error creating default team members:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Project Management Routes
// Get all projects for admin
router.get('/projects', verifyAdmin, async (req, res) => {
  try {
    const projects = await Project.find().sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add a new project
router.post('/projects', verifyAdmin, async (req, res) => {
  try {
    const { title, date, category, description, image, tags, link, featured, status, order } = req.body;
    
    const project = new Project({
      title,
      date,
      category,
      description,
      image,
      tags: Array.isArray(tags) ? tags : [],
      link: link || '#',
      featured: featured || false,
      status: status || 'completed',
      order: order || 0
    });
    
    await project.save();
    res.json({ success: true, data: project });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update a project
router.patch('/projects/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const project = await Project.findByIdAndUpdate(id, updates, { new: true });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    res.json({ success: true, data: project });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete a project
router.delete('/projects/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await Project.findByIdAndDelete(id);
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Setup default projects
router.post('/setup-default-projects', async (req, res) => {
  try {
    // Check if projects already exist
    const existingCount = await Project.countDocuments();
    if (existingCount > 0) {
      return res.json({ 
        success: true, 
        message: `Database already has ${existingCount} projects. Skipping setup.` 
      });
    }

    const defaultProjects = [
      {
        title: 'VulnScanner Pro',
        date: 'August 2023',
        category: 'Tool Release',
        description: 'Our latest open-source vulnerability scanner that combines static analysis with dynamic testing to identify security flaws in web applications. Features custom rule sets and integration with CI/CD pipelines.',
        image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
        tags: ['Web Security', 'OWASP', 'Static Analysis', 'Open Source'],
        link: '#',
        featured: true,
        status: 'completed',
        order: 1
      },
      {
        title: 'SecureDrop 2.0',
        date: 'Q4 2023',
        category: 'Research',
        description: 'Enhanced secure file sharing system with post-quantum encryption and improved metadata protection.',
        image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
        tags: ['Encryption', 'Privacy', 'File Sharing'],
        link: '#',
        featured: false,
        status: 'upcoming',
        order: 2
      },
      {
        title: 'Kernel Exploit Workshop',
        date: 'November 2023',
        category: 'Training',
        description: 'Hands-on workshop covering advanced kernel exploitation techniques for both Windows and Linux systems.',
        image: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1674&q=80',
        tags: ['Kernel', 'Exploitation', 'Training'],
        link: '#',
        featured: false,
        status: 'upcoming',
        order: 3
      },
      {
        title: 'IoT Firmware Analysis Framework',
        date: 'May 2023',
        category: 'Tool Release',
        description: 'Automated framework for extracting, analyzing, and testing IoT firmware for security vulnerabilities.',
        image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
        tags: ['IoT', 'Firmware', 'Reverse Engineering'],
        link: '#',
        featured: false,
        status: 'completed',
        order: 4
      },
      {
        title: 'APT Campaign Attribution Study',
        date: 'March 2023',
        category: 'Research',
        description: 'Comprehensive analysis of attribution techniques for Advanced Persistent Threat campaigns.',
        image: 'https://images.unsplash.com/photo-1510511459019-5dda7724fd87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
        tags: ['APT', 'Threat Intelligence'],
        link: '#',
        featured: false,
        status: 'completed',
        order: 5
      },
      {
        title: 'Web3 Security Challenges',
        date: 'January 2023',
        category: 'CTF',
        description: 'Set of blockchain and smart contract security challenges released to the community.',
        image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
        tags: ['Blockchain', 'Smart Contracts', 'CTF'],
        link: '#',
        featured: false,
        status: 'completed',
        order: 6
      },
      {
        title: 'Memory Corruption Masterclass',
        date: 'November 2022',
        category: 'Training',
        description: 'Advanced training on memory corruption vulnerabilities and modern exploit mitigations.',
        image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
        tags: ['Exploit Dev', 'Training'],
        link: '#',
        featured: false,
        status: 'completed',
        order: 7
      }
    ];

    await Project.insertMany(defaultProjects);
    
    res.json({
      success: true,
      message: `Successfully created ${defaultProjects.length} default projects`
    });
  } catch (error) {
    console.error('Error creating default projects:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add more admin routes for other models...
// (Similar patterns for subscriptions, applications, projects, reports, feedback)

// =================
// REPORT MANAGEMENT
// =================

// Get all reports
router.get('/reports', async (req: any, res: any) => {
  try {
    const reports = await Report.find()
      .sort({ createdAt: -1 }); // Most recent first

    res.json({
      success: true,
      reports
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single report by ID
router.get('/reports/:id', async (req: any, res: any) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update report status and admin notes
router.patch('/reports/:id', async (req: any, res: any) => {
  try {
    const { status, adminNotes } = req.body;
    
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { 
        ...(status && { status }),
        ...(adminNotes !== undefined && { adminNotes })
      },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.json({
      success: true,
      message: 'Report updated successfully',
      report
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete report
router.delete('/reports/:id', async (req: any, res: any) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Clear all reports
router.delete('/reports', async (req: any, res: any) => {
  try {
    await Report.deleteMany({});
    
    res.json({
      success: true,
      message: 'All reports cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing reports:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ========================
// APPLICATION MANAGEMENT
// ========================

// Get all team applications
router.get('/applications', verifyAdmin, async (req, res) => {
  try {
    const applications = await TeamApplication.find().sort({ createdAt: -1 });
    res.json({ success: true, applications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single application
router.get('/applications/:id', verifyAdmin, async (req, res) => {
  try {
    const application = await TeamApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    res.json({ success: true, application });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update application status
router.patch('/applications/:id', verifyAdmin, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const application = await TeamApplication.findByIdAndUpdate(
      req.params.id,
      { status, adminNotes },
      { new: true }
    );
    
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Application updated successfully',
      application 
    });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete application
router.delete('/applications/:id', verifyAdmin, async (req, res) => {
  try {
    const application = await TeamApplication.findByIdAndDelete(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    res.json({ 
      success: true, 
      message: 'Application deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Clear all applications
router.delete('/applications', verifyAdmin, async (req, res) => {
  try {
    await TeamApplication.deleteMany({});
    res.json({
      success: true,
      message: 'All applications cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing applications:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
