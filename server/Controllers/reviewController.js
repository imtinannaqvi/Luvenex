import Review from "../models/Review.js";
import User from "../models/User.js";
import Deal from "../models/Deal.js";
import InfluencerProfile from "../models/InfluencerProfile.js";
import BrandProfile from "../models/BrandProfile.js";
import PlatformSettings from "../models/PlatformSettings.js";

import { notify } from "../services/notification.service.js";

const updateAvgRating = async (revieweeId) => {
    const reviews = await Review.find({ revieweeId });
    const avg = reviews.length
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;
    const rounded = Math.round(avg * 10) / 10;

    const user = await User.findById(revieweeId);
    if (!user) return;
    if (user.role === 'influencer') {
        await InfluencerProfile.findOneAndUpdate({ userId: revieweeId }, { avgRating: rounded });
    } else if (user.role === 'brand') {
        await BrandProfile.findOneAndUpdate({ userId: revieweeId }, { avgRating: rounded });
    }
};

export const createReview = async (req, res) => {
    try {
        const { rating, body } = req.body;   // ✅ moved to the very top

        const deal = await Deal.findById(req.params.id);
        if (!deal) return res.status(404).json({ error: { message: "Deal not found" } });

        if (deal.status !== "completed") {
            return res.status(400).json({ error: { message: "You can only review a completed deal" } });
        }

        const isBrand = deal.brandId.toString() === req.user._id.toString();
        const isInfluencer = deal.influencerId.toString() === req.user._id.toString();
        if (!isBrand && !isInfluencer) {
            return res.status(403).json({ error: { message: 'Not authorized' } });
        }

        const revieweeId = isBrand ? deal.influencerId : deal.brandId;

        if (rating == null || rating < 1 || rating > 5) {
            return res.status(400).json({ error: { message: "Rating must be between 1 and 5" } });
        }

        const settings = await PlatformSettings.getSettings();
        const needsModeration = settings.reviewModerationEnabled && rating <= settings.reviewModerationMinRating;

        const review = await Review.create({
            dealId: deal._id,
            reviewerId: req.user._id,
            revieweeId,
            rating,
            body,
            status: needsModeration ? 'pending' : 'published'
        });

        // ✅ fixed: only update the public average when NOT pending moderation
        if (!needsModeration) {
            await updateAvgRating(revieweeId);
        }

        await notify(
            revieweeId,
            'new_review',
            'You received a new review',
            `You got a ${rating}-star review`,
            deal._id
        );

        res.status(201).json({ review, requiresModeration: needsModeration });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: { message: 'You have already reviewed this deal' } });
        }
        res.status(500).json({ error: { message: err.message } });
    }
};

export const getUserReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ revieweeId: req.params.id, status: 'published' })
  .populate('reviewerId', 'name')
  .sort({ createdAt: -1 });
        res.json({ reviews });
    } catch (err) {
        res.status(500).json({ error: { message: err.message } });
    }
};

export const getMyReviewStatus = async (req, res) => {
    try {
        const existing = await Review.findOne({
            dealId: req.params._id,
            reviewerId: req.user._id
        });
        res.json({ hasReviewd: !!existing })
    } catch (error) {
        res.status(500).json({ error: { message: error.message } })

    }
}