import Deal from "../models/Deal.js";
import { releaseEscrow } from './escrow.service.js';
import { notify } from './notification.service.js';
import PlatformSettings from "../models/PlatformSettings.js";

const AUTO_RELEASE_DAYS = 5;

export const scheduleAutoRelease = async (deal) => {
  const settings = await PlatformSettings.getSettings();
  const releaseDate = new Date();
  releaseDate.setDate(releaseDate.getDate() + settings.autoReleaseDays);
  deal.autoReleaseAt = releaseDate;
};

export const runAutoReleaseSweep = async () => {
  const overdueDeals = await Deal.find({
    status: 'delivered',
    autoReleaseAt: { $lte: new Date() },
  });

  for (const deal of overdueDeals) {
    try {
      await releaseEscrow(deal);
      deal.status = 'auto_released';
      await deal.save();

      await notify(
        deal.influencerId,
        'deal_approved',
        'Payment auto-released',
        `The brand didn't respond to your delivery for "${deal.title}" within ${AUTO_RELEASE_DAYS} days, so your payment was automatically released. You can now file a complaint if you'd like.`,
        deal._id
      );
      await notify(
        deal.brandId,
        'deal_approved',
        'Deal auto-released',
        `You didn't respond to the delivered work for "${deal.title}" in time, so payment was automatically released to the influencer.`,
        deal._id
      );

      console.log(`[AUTO-RELEASE] Deal ${deal._id} auto-released to influencer`);
    } catch (err) {
      console.error(`[AUTO-RELEASE] Failed for deal ${deal._id}:`, err.message);
    }
  }

  return overdueDeals.length;
};

const TRANSITIONS = {
  draft:       ['agreed', 'cancelled'],
  agreed:      ['funded', 'cancelled'],
  funded:      ['in_progress', 'cancelled'],
  in_progress: ['delivered', 'cancelled'],
  delivered:   ['approved', 'in_progress', 'cancelled', 'auto_released'],  
  approved:    ['completed'],
  auto_released: ['completed'],
};

export const assertTransition = (from, to) => {
  if (!TRANSITIONS[from]?.includes(to)) {
    throw { status: 400, message: `Illegal transition: ${from} → ${to}` };
  }
};