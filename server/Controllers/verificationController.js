import User from "../models/User.js";
import Deal from '../models/Deal.js';
import PlatformSettings from '../models/PlatformSettings.js';

const REAPPLY_COOLDOWN_DAYS = 7;

export const requestVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    const request = user.verificationRequest;

    if (request?.status === 'approved') {
      return res.status(400).json({
        error: { message: 'Your account is already verified.' }
      });
    }

   
    if (request?.status === 'pending') {
      return res.status(400).json({
        error: { message: 'You already have a verification request pending review.' }
      });
    }

    if (request?.status === 'rejected' && request.reviewedAt) {
      const daysSince = (Date.now() - new Date(request.reviewedAt).getTime()) / 86400000;
      if (daysSince < REAPPLY_COOLDOWN_DAYS) {
        const wait = Math.ceil(REAPPLY_COOLDOWN_DAYS - daysSince);
        return res.status(400).json({
          error: {
            message: `Your last request was declined. You can apply again in ${wait} day${wait === 1 ? '' : 's'}.`
          }
        });
      }
    }

    const reason = String(req.body.reason || '').trim();
    if (!reason) {
      return res.status(400).json({
        error: { message: 'Tell us why you should be verified.' }
      });
    }
    if (reason.length > 1000) {
      return res.status(400).json({
        error: { message: 'Keep your reason under 1000 characters.' }
      });
    }

    const settings = await PlatformSettings.getSettings();

    const completedDealsCount = await Deal.countDocuments({
      $or: [{ brandId: req.user._id }, { influencerId: req.user._id }],
      status: { $in: ['completed', 'auto_released'] },
    });

    if (completedDealsCount < settings.minDealsForVerification) {
      return res.status(400).json({
        error: {
          message: `You need at least ${settings.minDealsForVerification} completed deals to request verification. You currently have ${completedDealsCount}.`
        }
      });
    }

    user.verificationRequest = {
      status: 'pending',
      reason,
      submittedAt: new Date(),
      // Clear review data left over from a previous rejected attempt.
      reviewedAt: null,
      rejectionReason: null,
    };
    await user.save();

    res.json({ message: 'Verification request submitted' });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};