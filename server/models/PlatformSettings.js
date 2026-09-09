import mongoose from 'mongoose';

const platformSettingsSchema = new mongoose.Schema({
  brandFeePercent: {
    type: Number,
    default: 5
  },
  influencerFeePercent: {
    type: Number,
    default: 5
  },

  // ── Referral reward as a PERCENT of the referred user's first deal ──
  // This is what the referral service and the referral page both read.
  referralRewardPercent: {
    type: Number,
    default: 5
  },

  // Legacy fixed-amount field — kept for backward compatibility.
  // Safe to remove once you confirm nothing else references it.
  referralRewardMinor: {
    type: Number,
    default: 50000
  },

  minWithdrawalMinor: {
    type: Number,
    default: 100000
  },
  autoReleaseDays: {
    type: Number,
    default: 5
  },
  minDealPriceMinor: {
    type: Number,
    default: 50000
  },
  maxDealPriceMinor: {
    type: Number,
    default: 0
  },
  minDealsForVerification: { type: Number, default: 10 },

  kycRequired: {
    type: Boolean,
    default: true
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  maintenanceMessage: {
    type: String,
    default: "We'll be back soon."
  },
  complaintAutoFlagThreshold: {
    type: Number,
    default: 3
  },

  // ── Announcement banner ──
  // DEPRECATED: replaced by the Announcement collection, which supports
  // multiple banners with audience targeting and expiry dates.
  // Remove these two once scripts/migrateSettings.js has run AND you have
  // updated every consumer of getPublicSettings.
  announcementEnabled: {
    type: Boolean,
    default: false
  },
  announcementMessage: {
    type: String,
    default: ""
  },

  changeLog: [{
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changes: {
      type: mongoose.Schema.Types.Mixed
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
  }],

  reviewModerationEnabled: { type: Boolean, default: false },
  reviewModerationMinRating: { type: Number, default: 2 },
  inactiveAccountAutoSuspendDays: { type: Number, default: 0 },

  // ── ADDED ──
  // The admin UI has been writing to these since it was built, but they were
  // never declared here, so Mongoose silently dropped them on save.

  // Scheduled maintenance window. Null on both means the maintenanceMode
  // toggle is controlled manually.
  maintenanceStartAt: { type: Date, default: null },
  maintenanceEndAt: { type: Date, default: null },

  // Force users to pick a reason before deactivating their account.
  deactivationReasonRequired: { type: Boolean, default: false },

  // Flag creators whose *average* rating falls to or below the threshold.
  lowRatingFlagEnabled: { type: Boolean, default: false },
  lowRatingThreshold: { type: Number, default: 2.5, min: 1, max: 5 },

  // Flag any *single* review at or below this rating, regardless of average.
  singleReviewFlagRating: { type: Number, default: 2, min: 1, max: 5 },
}, { timestamps: true });

platformSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) settings = await this.create({});

  // Self-heal: if this document was created before referralRewardPercent
  // existed, write the default in once so reads return a real value.
  if (settings.referralRewardPercent === undefined || settings.referralRewardPercent === null) {
    settings.referralRewardPercent = 5;
    await settings.save();
  }

  return settings;
};

export default mongoose.models.PlatformSettings || mongoose.model('PlatformSettings', platformSettingsSchema);