import mongoose from "mongoose";

const ledgerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  dealId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Deal",
  },
  type: {
    type: String,
    enum: [
      'commission',
      "withdrawal",
      "escrow_hold",
      "escrow_release",
      "refund",
      "deposit",
    ],
    required: true,
  },
  amountMinor: {
    type: Number,
    required: true,
  },
  balanceAfterMinor: {
    type: Number,
    required: true,
  },
  description: String,
}, { timestamps: true });

export default mongoose.models.Ledger || mongoose.model('Ledger', ledgerSchema);