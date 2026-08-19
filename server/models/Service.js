import mongoose from "mongoose";

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
    isActive: {
        type: Boolean,
        default: true   // ✅ changed — services are visible immediately unless manually hidden
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }

}, { timestamps: true })

export default mongoose.models.Service || mongoose.model('Service', serviceSchema)