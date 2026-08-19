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
        type: mongoose.Schema.Types.Mixed },
    changedAt: {
         type: Date,
          default: Date.now },
  }],

  reviewModerationEnabled: { type: Boolean, default: false },
reviewModerationMinRating: { type: Number, default: 2 }, 
inactiveAccountAutoSuspendDays: { type: Number, default: 0 }, 
}, { timestamps: true });

platformSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) settings = await this.create({});
  return settings;
};

export default mongoose.models.PlatformSettings || mongoose.model('PlatformSettings', platformSettingsSchema);