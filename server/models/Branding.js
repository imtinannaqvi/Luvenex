import mongoose from 'mongoose';

/**
 * Singleton — one branding document. Read it with Branding.getBranding()
 * so the first request creates it instead of 404ing.
 */
const brandingSchema = new mongoose.Schema({
  // Server-relative paths, e.g. "/uploads/branding/logo-123.png"
  logo: { type: String, default: null },
  favicon: { type: String, default: null },

  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

brandingSchema.statics.getBranding = async function () {
  let branding = await this.findOne();
  if (!branding) branding = await this.create({});
  return branding;
};

export default mongoose.models.Branding || mongoose.model('Branding', brandingSchema);