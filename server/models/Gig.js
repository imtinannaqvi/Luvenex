import mongoose from 'mongoose';

const gigSchema = new mongoose.Schema({
  influencerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String },
  deliverablesJson: { type: mongoose.Schema.Types.Mixed },
  priceMinor: { type: Number, required: true },
  deliveryDays: { type: Number, required: true },   // ← "Days" not "Date"
  revisions: { type: Number, default: 1 },
  category: { type: String },
 status: {
  type: String,
  enum: ['active', 'paused', 'draft', 'archived'],
  default: 'active',
},
}, { timestamps: true });

export default mongoose.models.Gig || mongoose.model('Gig', gigSchema);