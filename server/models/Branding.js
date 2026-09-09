import mongoose from 'mongoose';

/**
 * Singleton — there is only ever one branding document. Read it with
 * Branding.getBranding() so the first request creates it instead of 404ing.
 * Same pattern as PlatformSettings.getSettings().
 */
const brandingSchema = new mongoose.Schema({
  platformName: { type: String, default: '', trim: true, maxlength: 80 },
  tagline: { type: String, default: '', trim: true, maxlength: 160 },

  // Stored as server-relative paths, e.g. "/uploads/branding/logo-123.png".
  logo: { type: String, default: null },
  logoDark: { type: String, default: null },
  favicon: { type: String, default: null },
  ogImage: { type: String, default: null },

  primaryColor: { type: String, default: '#000000' },
  primaryDark: { type: String, default: '#000000' },

  socials: {
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    tiktok: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    youtube: { type: String, default: '' },
  },

  changeLog: [{
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changes: { type: mongoose.Schema.Types.Mixed },
    changedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

brandingSchema.statics.getBranding = async function () {
  let branding = await this.findOne();
  if (!branding) branding = await this.create({});
  return branding;
};

export default mongoose.models.Branding || mongoose.model('Branding', brandingSchema);