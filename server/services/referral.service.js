import User from "../models/User.js";
import Wallet from '../models/Wallet.js'
import Deal from '../models/Deal.js';
import Ledger from '../models/Ledger.js';
import {notify} from './notification.service.js'

const REFERRAL_REWARD_MINOR = 5000;

export const checkAndRewardReferral = async(userId) {
    try{
    const user = await User.findById(userId);
    if(!user || !user.referredBy) return;
      const completedDealsCount = await Deal.countDocuments({
      $or: [{ brandId: userId }, { influencerId: userId }],
      status: { $in: ['completed', 'auto_released'] },
    });

    if (completedDealsCount !== 1) return;
    if(user.referredBy.toString() === userId.toString()) return;

    const referrer = await User.findById(user.referredBy);
    if(!referrer) return;

     let Wallet = await User.findOne({ userId: user._id})
     if(!Wallet) Wallet = await Wallet.create({userI: referrer._id, balanceMinor: 0, escrowMinor: 0})

        wallet.balanceMinor += REFERRAL_REWARD_MINOR;
        await wallet.save();

        await Ledger.create({
            userId: referrer._id,
            type:'deposit',
            amountMinor: REFERRAL_REWARD_MINOR,
            balanceAfterMinor: wallet.balanceMinor,
            description: `Referral  reward for inviting ${user.name}`
        })

         referrer.referralRewardsEarnedMinor = (referrer.referralRewardsEarnedMinor || 0) + REFERRAL_REWARD_MINOR;
    await referrer.save();

    await notify(
      referrer._id,
      'payout_received',
      'Referral reward earned!',
      `${user.name} completed their first deal — you earned PKR ${REFERRAL_REWARD_MINOR / 100} for referring them.`,
    );
  } catch (err) {
    console.error('[REFERRAL] Error processing reward:', err.message);
  }
};

