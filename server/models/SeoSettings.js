import mongoose from 'mongoose';


const seoSettingsSchema = new mongoose.Schema({
  siteName: { type: String, default: 'Luvenex', trim: true, maxlength: 80 },
  titleTemplate: { type: String, default: '%s | Luvenex', trim: true, maxlength: 120 },
  defaultDescription: { type: String, default: '', trim: true, maxlength: 320 },
  defaultKeywords: { type: String, default: '', trim: true, maxlength: 500 },
  canonicalBaseUrl: { type: String, default: '', trim: true },


  allowIndexing: { type: Boolean, default: true },

  /* ── Social sharing ── */
  ogImage: { type: String, default: null },
  ogTitle: { type: String, default: '', trim: true, maxlength: 120 },
  ogDescription: { type: String, default: '', trim: true, maxlength: 320 },
  twitterCard: {
    type: String,
    enum: ['summary', 'summary_large_image'],
    default: 'summary_large_image',
  },
  twitterHandle: { type: String, default: '', trim: true, maxlength: 40 },

  robotsTxt: {
    type: String,
    default: 'User-agent: *\nAllow: /\n',
    maxlength: 5000,
  },
  sitemapIncludeBlog: { type: Boolean, default: true },
  sitemapIncludeProfiles: { type: Boolean, default: true },
  sitemapIncludeServices: { type: Boolean, default: true },
  sitemapChangeFreq: {
    type: String,
    enum: ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'],
    default: 'weekly',
  },
  sitemapPriority: { type: Number, default: 0.7, min: 0, max: 1 },

  googleAnalyticsId: { type: String, default: '', trim: true, maxlength: 40 },
  googleSiteVerification: { type: String, default: '', trim: true, maxlength: 120 },
  bingSiteVerification: { type: String, default: '', trim: true, maxlength: 120 },
  facebookPixelId: { type: String, default: '', trim: true, maxlength: 40 },

  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

seoSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) settings = await this.create({});
  return settings;
};

export default mongoose.models.SeoSettings || mongoose.model('SeoSettings', seoSettingsSchema);