import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscription extends Document {
  email: string;
  isActive: boolean;
  unsubscribeToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  unsubscribeToken: {
    type: String,
  },
}, {
  timestamps: true,
});

export default mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
