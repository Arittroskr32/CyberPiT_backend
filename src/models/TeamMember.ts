export interface ITeamMember {
  _id?: string;
  name: string;
  role: string;
  image: string;
  bio: string;
  order?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for sorting by order
teamMemberSchema.index({ order: 1, createdAt: 1 });

const TeamMember = mongoose.model('TeamMember', teamMemberSchema);

export default TeamMember;
