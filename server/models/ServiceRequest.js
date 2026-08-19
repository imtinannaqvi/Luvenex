import mongoose from "mongoose";

const serviceRequestSchema = new mongoose.Schema({
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
  },
  title: {
    required: true,
    type: String,
  },
  description: {
    required: true,
    type: String,
  },
  category: {
    type: String,
  },
  budgetMinMinor: {
    type: Number,
  },
  budgetMaxMinor: {
    type: Number,
  },
  deadline: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['pending', 'matched', 'cancelled', 'closed'],
    default: 'pending',
  },
  matchedInfluencerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  matchedAt: {
    type: Date,
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
  },
  adminNotes: {
    type: String,
  },
}, { timestamps: true });

export default mongoose.models.ServiceRequest || mongoose.model('ServiceRequest', serviceRequestSchema);