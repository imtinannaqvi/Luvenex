import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, default: '', maxlength: 1000 },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'danger'],
    default: 'info',
  },
  audience: {
    type: [String],
    enum: ['all', 'brands', 'influencers'],
        default: ['all'],
  },
  startAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null },
  isDismissible: { type: Boolean, default: true },
  ctaLabel: { type: String, default: '' },
  ctaUrl: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Supports the public "what should this visitor see right now" query.
announcementSchema.index({ isActive: 1, startAt: 1, expiresAt: 1 });

export default mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);