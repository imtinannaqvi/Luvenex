import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
  },
  influencerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  attachedPortfolioItemId: { type: mongoose.Schema.Types.ObjectId },   

  proposalText: { type: String, required: true },
  proposedPriceMinor: { type: Number },  
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  proposedDeliveryDays: { type: Number },
}, { timestamps: true });

applicationSchema.index({ campaignId: 1, influencerId: 1 }, { unique: true });

export default mongoose.models.Application || mongoose.model('Application', applicationSchema);