import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  postedByRole: {
    type: String,
    enum: ['influencer', 'brand'],
    required: true
  },
  caption: {
    type: String
  },
  videoUrl: {
    type: String,
    required: true
  },
  category: {
    type: String
  },
  allowDownload:{
    type:Boolean,
    default:false
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  savedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  viewCount: {
    type: Number,
    default: 0   // ✅ fixed — real number, not a quoted string
  },
}, { timestamps: true });

export default mongoose.models.Video || mongoose.model('Video', videoSchema);