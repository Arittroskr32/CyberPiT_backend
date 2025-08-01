import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Admin from './models/Admin.js';

// Load environment variables
dotenv.config({ path: '../.env' });

const setupAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/cyberpit';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: process.env.ADMIN_EMAIL || 'admin@cyberpit.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists, updating credentials...');
      
      // Update the existing admin with new password
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);
      existingAdmin.password = hashedPassword;
      existingAdmin.isActive = true;
      await existingAdmin.save();
      
      console.log('✅ Admin user updated successfully');
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`🔑 Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);
    
    const admin = new Admin({
      email: process.env.ADMIN_EMAIL || 'admin@cyberpit.com',
      password: hashedPassword,
      name: 'CyberPiT Admin',
      role: 'super-admin'
    });

    await admin.save();
    console.log('✅ Admin user created successfully');
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔑 Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    
  } catch (error) {
    console.error('❌ Error setting up admin:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

setupAdmin();
