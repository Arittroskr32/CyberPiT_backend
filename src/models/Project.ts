import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  _id: string;
  title: string;
  date: string;
  category: string;
  description: string;
  image: string;
  tags: string[];
  link: string;
  featured?: boolean;
  status: 'active' | 'upcoming' | 'completed' | 'archived';
  order?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  date: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  tags: [{
    type: String,
    required: true,
  }],
  link: {
    type: String,
    default: '#',
  },
  featured: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['active', 'upcoming', 'completed', 'archived'],
    default: 'completed',
  },
  order: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Index for sorting by order and createdAt
ProjectSchema.index({ order: 1, createdAt: -1 });
ProjectSchema.index({ featured: 1, status: 1 });

export default mongoose.model<IProject>('Project', ProjectSchema);
