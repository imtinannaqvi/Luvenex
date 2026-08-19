import Wallet from "../models/Wallet.js";
import Ledger from "../models/Ledger.js";

// Find a user's wallet, or create one if it doesn't exist yet
export const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    wallet = await Wallet.create({ userId, balanceMinor: 0, escrowMinor: 0 });
  }
  return wallet;
};

// Brand funds a deal — move money from balance into escrow (held)
export const fundDeal = async (deal) => {
  const wallet = await getOrCreateWallet(deal.brandId);
  const totalToHold = deal.priceMinor + deal.brandFeeMinor;

  if (wallet.balanceMinor < totalToHold) {
    const err = new Error('Insufficient wallet balance for this deal');
    err.status = 400;
    throw err;
  }

  wallet.balanceMinor -= totalToHold;
  wallet.escrowMinor += totalToHold;
  await wallet.save();

  await Ledger.create({
    userId: deal.brandId,
    dealId: deal._id,
    type: "escrow_hold",
    amountMinor: totalToHold,
    balanceAfterMinor: wallet.balanceMinor,
    description: `Funded deal: ${deal.title}`,
  });

  return wallet;
};

// Brand approves — release escrow to influencer, take commission
export const releaseEscrow = async (deal) => {
  const brandWallet = await getOrCreateWallet(deal.brandId);
  const influencerWallet = await getOrCreateWallet(deal.influencerId);

  const totalHeld = deal.priceMinor + deal.brandFeeMinor;
  const influencerPayout = deal.priceMinor - deal.influencerFeeMinor; // influencer gets P − 5%

  // remove the held funds from the brand's escrow
  brandWallet.escrowMinor -= totalHeld;
  await brandWallet.save();

  // pay the influencer
  influencerWallet.balanceMinor += influencerPayout;
  await influencerWallet.save();

  await Ledger.create({
    userId: deal.influencerId,
    dealId: deal._id,
    type: 'escrow_release',
    amountMinor: influencerPayout,
    balanceAfterMinor: influencerWallet.balanceMinor,
    description: `Payout for: ${deal.title}`,
  });

  await Ledger.create({
    userId: deal.brandId,
    dealId: deal._id,
    type: "commission",
    amountMinor: deal.commissionMinor,
    balanceAfterMinor: brandWallet.balanceMinor,
    description: `Platform commission for: ${deal.title}`,
  });

  return { brandWallet, influencerWallet };
};

// Cancelled deal — refund the held money back to the brand
export const refundEscrow = async (deal) => {
  const wallet = await getOrCreateWallet(deal.brandId);
  const totalHeld = deal.priceMinor + deal.brandFeeMinor;

  wallet.escrowMinor -= totalHeld;
  wallet.balanceMinor += totalHeld;
  await wallet.save();

  await Ledger.create({
    userId: deal.brandId,
    dealId: deal._id,
    type: 'refund',
    amountMinor: totalHeld,
    balanceAfterMinor: wallet.balanceMinor,
    description: `Refund for cancelled deal: ${deal.title}`,
  });

  return wallet;
};