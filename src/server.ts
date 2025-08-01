import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import contactRoutes from './routes/contact.js';
import subscriptionRoutes from './routes/subscription.js';
import teamRoutes from './routes/team.js';
import projectRoutes from './routes/project.js';
import reportRoutes from './routes/report.js';
import videoRoutes from './routes/video.js';
import feedbackRoutes from './routes/feedback.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(limiter);
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static video files
app.use('/video', express.static(path.join(process.cwd(), '../frontend/public/video')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/feedback', feedbackRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CyberPiT API is running' });
});

// Serve static files from frontend build (if serving frontend from backend)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(process.cwd(), '../frontend/dist')));
  
  // Handle SPA routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({
        success: false,
        message: 'API route not found'
      });
    }
    
    // Serve index.html for all frontend routes
    res.sendFile(path.join(process.cwd(), '../frontend/dist/index.html'));
  });
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler for API routes only
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
});
