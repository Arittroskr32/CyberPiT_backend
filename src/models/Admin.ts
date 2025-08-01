import mongoose, { Document, Schema } from 'mongoose';

export interface IAdmin extends Document {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'super-admin';
  lastLogin?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ['admin', 'super-admin'],
    default: 'admin',
  },
  lastLogin: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model<IAdmin>('Admin', AdminSchema);
