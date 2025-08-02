import mongoose, { Document, Schema } from 'mongoose';

export interface IBlog extends Document {
  title: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  imageUrl?: string;
  imagePublicId?: string;
  blogUrl?: string;
  isPublished: boolean;
  isFeatured: boolean;
  readTime: number;
  views: number;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema: Schema = new Schema({
  title: {
    type: String,
    required: [true, 'Blog title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Blog content is required']
  },
  author: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Web Security', 'Network Security', 'Penetration Testing', 'Malware Analysis', 'CTF', 'Research', 'Tools', 'Other']
  },
  tags: [{
    type: String,
    trim: true
  }],
  imageUrl: {
    type: String,
    default: null
  },
  imagePublicId: {
    type: String,
    default: null
  },
  blogUrl: {
    type: String,
    default: null,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Allow empty/null values
        return /^https?:\/\/.+/.test(v); // Validate URL format
      },
      message: 'Blog URL must be a valid HTTP/HTTPS URL'
    }
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  readTime: {
    type: Number,
    default: 5 // estimated read time in minutes
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for search functionality
BlogSchema.index({ title: 'text', content: 'text', tags: 'text' });
BlogSchema.index({ category: 1 });
BlogSchema.index({ isPublished: 1 });
BlogSchema.index({ isFeatured: 1 });
BlogSchema.index({ createdAt: -1 });

export default mongoose.model<IBlog>('Blog', BlogSchema);
