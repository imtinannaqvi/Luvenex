import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, required: true, trim: true, maxlength: 1000 },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'danger'],
    default: 'info',
  },
  // Single choice — 'all' covers both brands and influencers.
  audience: {
    type: String,
    enum: ['all', 'brands', 'influencers'],
    default: 'all',
  },
  // Null means it never expires.
  expiresAt: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Supports the public "what should this visitor see right now" query.
announcementSchema.index({ isActive: 1, expiresAt: 1 });

export default mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);