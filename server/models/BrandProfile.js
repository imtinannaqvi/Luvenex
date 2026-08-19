import mongoose from 'mongoose';

const brandProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  coverUrl: { type: String },
  handle: { type: String, unique: true, sparse: true, lowercase: true },
  companyName: { type: String },
  industry: { type: String },
  website: { type: String },
  bio: { type: String },
  avatarUrl: { type: String },           
  portfolio: [{
    title: { type: String, required: true },
    description: String,
    mediaType: { type: String, enum: ['image', 'video'], required: true },
    mediaUrl: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  }],
  isVerified: { type: Boolean, default: false },
  avgRating: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.BrandProfile || mongoose.model('BrandProfile', brandProfileSchema);