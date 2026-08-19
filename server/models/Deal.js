import mongoose from "mongoose";

const dealSchema = new mongoose.Schema({
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  influencerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sourceType: {
    type: String,
    enum: [
      'custom', 'gig', 'application', 'campaign'
    ],
    default: "custom"
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  deliverables: {
    type: String
  },
  priceMinor: {
    type: Number,
    required: true
  },
  brandFeeMinor: {
    default: 0,
    type: Number
  },
  influencerFeeMinor: {
    default: 0,
    type: Number
  },
  commissionMinor: {
    type: Number,
    default: 0
  },
  deadline: {
    type: Date
  },
  status: {
    type: String,
    enum: [
      'draft', 'agreed', 'funded', 'in_progress',
      'delivered', 'approved', 'released', 'completed',
      'disputed', 'cancelled', 'refunded', 'auto_released'
    ],
    default: 'draft',
  },
  deliveryNote: {
    type: String
  },
  deliveryFiles: [{ type: String }],
  autoReleaseAt: {
    type: Date
  },
  cancellationRequest: {
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String },
    requestedAt: { type: Date },
    status: {
      type: String,
      enum: ['none', 'pending', 'agreed', 'rejected'],
      default: 'none',
    },
  },
  revisionNote: { type: String },
}, { timestamps: true })

export default mongoose.models.Deal || mongoose.model('Deal', dealSchema)