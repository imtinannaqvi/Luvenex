import mongoose from 'mongoose';

/**
 * Config for the floating WhatsApp support widget on the public site.
 * Singleton — one document, read it with Support.getSupport().
 */
const supportSchema = new mongoose.Schema({
  isEnabled: { type: Boolean, default: true },

  // Country code + number, digits only: "923001234567". No +, spaces or
  // dashes, because that's the format wa.me links require.
  whatsappNumber: { type: String, default: '', trim: true },

  primaryColor: { type: String, default: '#25D366' }, // WhatsApp green
  widgetPosition: {
    type: String,
    enum: ['bottom-right', 'bottom-left'],
    default: 'bottom-right',
  },
  buttonIcon: {
    type: String,
    enum: ['headset', 'chat-bubble', 'whatsapp'],
    default: 'headset',
  },

  headerTitle: { type: String, default: 'Support', trim: true, maxlength: 60 },
  headerSubtitle: { type: String, default: '', trim: true, maxlength: 100 },
  greetingMessage: { type: String, default: '', trim: true, maxlength: 400 },

  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

supportSchema.statics.getSupport = async function () {
  let support = await this.findOne();
  if (!support) support = await this.create({});
  return support;
};

export default mongoose.models.Support || mongoose.model('Support', supportSchema);