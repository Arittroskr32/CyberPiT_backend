import mongoose, { Document, Schema } from 'mongoose';

export interface IFeedback extends Document {
  name: string;
  email: string;
  role: string;
  workplace: string;
  comment: string;
  rating: number;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  role: {
    type: String,
    required: false,
    trim: true,
  },
  workplace: {
    type: String,
    required: false,
    trim: true,
  },
  comment: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  featured: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

export default mongoose.model<IFeedback>('Feedback', FeedbackSchema);
