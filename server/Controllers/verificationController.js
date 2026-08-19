import User from "../models/User.js";
import Deal from '../models/Deal.js';
import PlatformSettings from '../models/PlatformSettings.js';
export const requestVerification = async (req, res) => {
  try {
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

    const { reason } = req.body;
    const user = await User.findById(req.user._id);

    user.verificationRequest = {
      status: 'pending',
      reason,
      submittedAt: new Date(),
    };
    await user.save();

    res.json({ message: 'Verification request submitted' });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};