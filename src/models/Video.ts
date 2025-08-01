import mongoose, { Document, Schema } from 'mongoose';

export interface IVideo extends Document {
  name: string;
  type: 'desktop' | 'mobile';
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VideoSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['desktop', 'mobile'],
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model<IVideo>('Video', VideoSchema);
