import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true },
  codeHash: { type: String, required: true },
  purpose: {
    type: String,
    enum: ['verify_email', 'reset_password'],
    required: true,
  },
  expiresAt: { type: Date, required: true },
  consumedAt: { type: Date },
}, { timestamps: true });

// auto-delete expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Otp || mongoose.model('Otp', otpSchema);