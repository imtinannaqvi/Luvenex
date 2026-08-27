import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import Deal from "../models/Deal.js";
import Ledger from "../models/Ledger.js";
import PlatformSettings from "../models/PlatformSettings.js";
import { notify } from "./notification.service.js";

export const checkAndRewardReferral = async(dealId,userId) => {
  try {
 const user = await User.findById(userId);
 if(!user || !user.referredBy) return
 const completedDealsCount = await Deal.countDocuments({
      $or: [{ brandId: userId }, { influencerId: userId }],
      status: { $in: ['completed', 'auto_released'] },
    });
    
    if(completedDealsCount !== 1) return;
    if(user.referredBy.toString() === userId.toString()) return;
    const referrer = await User.findById(user.referredBy)
    if(!referrer) return;
    const deal = await Deal.findById(dealId);
    if(!deal) return;
    const settings = await PlatformSettings.getSettings();
    const referralPercent = settings.referralRewardPercent || 5;
    const rewardMinor = Math.round(deal.priceMinor * (referralPercent / 100))
        let wallet = await Wallet.findOne({ userId: referrer._id });
    if (!wallet) wallet = await Wallet.create({ userId: referrer._id, balanceMinor: 0, escrowMinor: 0 });

    wallet.balanceMinor += rewardMinor;
    await wallet.save();
    await Ledger.create({
      userId: referrer._id,
      type: 'deposit',
      amountMinor: rewardMinor,
      balanceAfterMinor: wallet.balanceMinor,
      description: `Referral reward (${referralPercent}%) for ${user.name}'s first deal`,
    });

    referrer.referralRewardsEarnedMinor = (referrer.referralRewardsEarnedMinor || 0) + rewardMinor;
    await referrer.save();


 
    await notify(
      referrer._id,
      'payout_received',
      'Referral reward earned!',
      `${user.name} completed their first deal — you earned PKR ${rewardMinor / 100} for referring them.`,
    );
  } catch (err) {
    console.error('[REFERRAL] Error processing reward:', err.message);
  }
};