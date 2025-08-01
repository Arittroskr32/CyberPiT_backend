import mongoose, { Document, Schema } from 'mongoose';

export interface IReport extends Document {
  title: string;
  description: string;
  reporterName: string;
  reporterEmail: string;
  category: string;
  projectUrl: string;
  status: 'new' | 'reviewing' | 'approved' | 'featured' | 'rejected';
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  reporterName: {
    type: String,
    required: true,
    trim: true,
  },
  reporterEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
  },
  projectUrl: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['new', 'reviewing', 'approved', 'featured', 'rejected'],
    default: 'new',
  },
  adminNotes: {
    type: String,
  },
}, {
  timestamps: true,
});

export default mongoose.model<IReport>('Report', ReportSchema);
