import mongoose, { Document, Schema } from 'mongoose';

export interface ITeamApplication extends Document {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  interest: string;
  comment: string;
  status: 'new' | 'reviewing' | 'accepted' | 'rejected';
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeamApplicationSchema: Schema = new Schema({
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
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  linkedin: {
    type: String,
    trim: true,
  },
  interest: {
    type: String,
    required: true,
  },
  comment: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['new', 'reviewing', 'accepted', 'rejected'],
    default: 'new',
  },
  adminNotes: {
    type: String,
  },
}, {
  timestamps: true,
});

export default mongoose.model<ITeamApplication>('TeamApplication', TeamApplicationSchema);
