import mongoose from "mongoose";

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  balanceMinor: {
    type: Number,
    default: 0, 
  },
  escrowMinor: {
    type: Number,
    default: 0, 
  },
}, { timestamps: true });

export default mongoose.models.Wallet || mongoose.model('Wallet', walletSchema);