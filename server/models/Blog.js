import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  content: { type: String, required: true },
  author: { type: String, default: "" },
  image: { type: String, default: "" },
  category: { type: String, default: "", trim: true },
  tags: { type: [String], default: [] },
  secondaryImages: { type: [String], default: [] },
  shortDescription: { type: String, default: "" },   
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled'],   
    default: 'draft',
  },
  publishedAt: { type: Date },
  isFeatured: { type: Boolean, default: false },     
  scheduledFor: { type: Date },                        
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

blogSchema.index({ title: 'text', content: 'text', tags: 'text' });

export default mongoose.models.Blog || mongoose.model('Blog', blogSchema);