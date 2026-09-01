import mongoose from "mongoose";

// Each section powers one item in the left-hand list on the service detail page.
// `description` is rich HTML (from the editor, images embedded inline).
const sectionSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const serviceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    shortDescription: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    // Tabbed sections shown on the public detail page (left list + right content).
    sections: {
        type: [sectionSchema],
        default: [],
    },
    coverImage: {
        type: String
    },
    iconUrl: { type: String },
    additionalImages: [{
        type: String
    }],
    videos: [{
        type: String
    }],
    category: {
        type: String
    },
    priceMinor: {
        type: Number
    },
    highlightTitle: { type: String },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }

}, { timestamps: true })

export default mongoose.models.Service || mongoose.model('Service', serviceSchema)