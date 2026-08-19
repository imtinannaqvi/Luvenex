import mongoose from "mongoose";

const influencerProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  handle: {
    unique: true,
    type: String,
    lowercase: true,
    sparse: true
  },
  bio: {
    type: String
  },
  coverUrl: { type: String },
  avatarUrl: { type: String },           
  niches: [{ type: String }],
  rateCardJson: { type: mongoose.Schema.Types.Mixed },
  socialAccounts: [{
    platform: String,
    handle: String,
    url: String,
    followersCount: Number,
  }],
  portfolio: [{
    title: { type: String, required: true },
    description: String,
    mediaType: { type: String, enum: ['image', 'video'], required: true },
    mediaUrl: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  }],
  isVerified: { type: Boolean, default: false },
  avgRating: { type: Number, default: 0 },
  followersCount: { type: Number, default: 0 },
  skills: { type: [String], default: [] },
languages: { type: [String], default: [] },
}, { timestamps: true });

export default mongoose.models.InfluencerProfile || mongoose.model('InfluencerProfile', influencerProfileSchema);