import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String
    },
    type: {
        type: String,
        enum: [
            "offer_received",
            "offer_accepted",
            "deal_funded",
            "deal_delivered",
            "deal_approved",
            "payout_received",
            "new_review",
            "application_received",
            "application_accepted",
            "application_rejected",
            "kyc_verified",
            "kyc_rejected",
            "payout_completed",
            "payout_rejected",
            "service_matched",
            "flagged_message",
            "new_message",         // message notifications
            "new_campaign"         // 👈 added — required so campaign broadcasts save
        ]
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId
    },
    isRead: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema);