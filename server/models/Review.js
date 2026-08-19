import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    dealId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Deal",
        required: true,
    },
    reviewerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    revieweeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    rating: {
        min: 1,
        max: 5,
        type: Number,
        required: true
    },
    body: {
        type: String
    },
    status: {
  type: String,
  enum: ['published', 'pending', 'rejected'],
  default: 'published',
},
}, { timestamps: true });

reviewSchema.index({ dealId: 1, reviewerId: 1 }, { unique: true });

export default mongoose.models.Review || mongoose.model('Review', reviewSchema);