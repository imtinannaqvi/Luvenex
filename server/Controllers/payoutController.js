import Payout from "../models/Payout.js";
import User from "../models/User.js";
import Ledger from "../models/Ledger.js";
import fs from 'fs';
import { getOrCreateWallet } from "../services/escrow.service.js";
import { notify } from "../services/notification.service.js";

export const submitKyc = async (req, res) => {
  try {
    const { cnicNumber, fullName } = req.body;
    if (!cnicNumber || !fullName) {
      return res.status(400).json({ error: { message: 'CNIC number and full name are required' } });
    }
    if (!req.files?.cnicFront || !req.files?.cnicBack) {
      return res.status(400).json({ error: { message: 'Both front and back CNIC images are required' } });
    }

    const existing = await User.findById(req.user._id);

    // clean up old images if resubmitting
    if (existing.kyc?.cnicFrontUrl) {
      const oldPath = `.${existing.kyc.cnicFrontUrl}`;
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    if (existing.kyc?.cnicBackUrl) {
      const oldPath = `.${existing.kyc.cnicBackUrl}`;
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        'kyc.status': 'pending',
        'kyc.cnicNumber': cnicNumber,
        'kyc.fullName': fullName,
        'kyc.cnicFrontUrl': `/uploads/kyc/${req.files.cnicFront[0].filename}`,
        'kyc.cnicBackUrl': `/uploads/kyc/${req.files.cnicBack[0].filename}`,
        'kyc.submittedAt': new Date(),
      },
      { new: true }
    );

    res.json({ kyc: user.kyc });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const getMyKyc = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('kyc');
    res.json({ kyc: user.kyc });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const reviewKyc = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Admin Only' } });
    }

    const { decision, rejectionReason } = req.body;
    if (!['verified', 'rejected'].includes(decision)) {
      return res.status(400).json({ error: { message: 'Decision must be verified or rejected' } });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        'kyc.status': decision,
        'kyc.reviewedAt': new Date(),
        'kyc.rejectionReason': decision === 'rejected' ? rejectionReason : undefined,
      },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: { message: "User not found" } });

    // notify the user of the decision
    if (decision === 'verified') {
      await notify(
        user._id,
        'kyc_verified',
        'Identity verified',
        'Your identity verification was approved. You can now withdraw your earnings.',
        user._id
      );
    } else {
      await notify(
        user._id,
        'kyc_rejected',
        'Identity verification rejected',
        `Reason: ${rejectionReason || 'Not specified'}. You can resubmit your details.`,
        user._id
      );
    }

    res.json({ kyc: user.kyc });

  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const requestPayout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.kyc.status !== 'verified') {
      return res.status(403).json({ error: { message: 'You must complete identity verification before withdrawing' } });
    }

    const { amountMinor, method, accountDetails } = req.body;
    if (!amountMinor || amountMinor <= 0) {
      return res.status(400).json({ error: { message: 'amountMinor must be positive' } });
    }
    if (!method || !accountDetails) {
      return res.status(400).json({ error: { message: 'method and accountDetails are required' } });
    }

    const wallet = await getOrCreateWallet(req.user._id);
    if (wallet.balanceMinor < amountMinor) {
      return res.status(400).json({ error: { message: 'Insufficient wallet balance' } });
    }

    wallet.balanceMinor -= amountMinor;
    await wallet.save();

    const payout = await Payout.create({
      userId: req.user._id,
      amountMinor,
      method,
      accountDetails,
      status: 'pending',
    });

    await Ledger.create({
      userId: req.user._id,
      type: 'withdrawal',
      amountMinor: -amountMinor,
      balanceAfterMinor: wallet.balanceMinor,
      description: `Payout request via ${method}`,
    });

    res.status(201).json({ payout });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const getmyPayouts = async (req, res) => {
  try {
    const payouts = await Payout.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ payouts });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const completePayout = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: "Admin Only" } });
    }
    const payout = await Payout.findById(req.params.id);
    if (!payout) {
      return res.status(404).json({ error: { message: 'Payout not Found' } });
    }

    payout.status = 'completed';
    await payout.save();

    // notify the user their money was sent
    await notify(
      payout.userId,
      'payout_completed',
      'Payout sent',
      `Your withdrawal of PKR ${(payout.amountMinor / 100).toLocaleString('en-PK')} has been sent via ${payout.method}.`,
      payout._id
    );

    res.json({ payout });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const rejectPayout = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Admin only' } });
    }

    const payout = await Payout.findById(req.params.id);
    if (!payout) return res.status(404).json({ error: { message: 'Payout not found' } });

    const { rejectionReason } = req.body;

    const wallet = await getOrCreateWallet(payout.userId);
    wallet.balanceMinor += payout.amountMinor;
    await wallet.save();

    await Ledger.create({
      userId: payout.userId,
      type: 'refund',
      amountMinor: payout.amountMinor,
      balanceAfterMinor: wallet.balanceMinor,
      description: `Payout rejected: ${rejectionReason || 'Not specified'}`,
    });

    payout.status = 'rejected';
    payout.rejectionReason = rejectionReason;
    await payout.save();

    // notify the user their payout was rejected and refunded
    await notify(
      payout.userId,
      'payout_rejected',
      'Payout rejected',
      `Your withdrawal was rejected (${rejectionReason || 'no reason given'}). The amount has been refunded to your wallet.`,
      payout._id
    );

    res.json({ payout });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};