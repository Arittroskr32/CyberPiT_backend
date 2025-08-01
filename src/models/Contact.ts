import mongoose, { Document, Schema } from 'mongoose';

export interface IContact extends Document {
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  adminResponse?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'replied'],
    default: 'unread',
  },
  adminResponse: {
    type: String,
  },
}, {
  timestamps: true,
});

export default mongoose.model<IContact>('Contact', ContactSchema);
