import mongoose from 'mongoose';

const dealActivitySchema = new mongoose.Schema({
  dealId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal',
    required: true,
  },
  type: {
    type: String,
    enum: [
      'created', 'accepted', 'funded', 'started', 'delivered',
      'revision_requested', 'approved', 'completed', 'auto_released',
      'cancelled', 'refunded', 'reviewed', 'complaint_filed',
      'admin_released', 'admin_note',
    ],
    required: true,
  },
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  message: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

export default mongoose.models.DealActivity || mongoose.model('DealActivity', dealActivitySchema);