import Deal from "../models/Deal.js";
import Ledger from "../models/Ledger.js";
import { computeFees } from "../lib/money.js";
import { assertTransition } from "../services/deal.service.js";
import {
  fundDeal as fundDealService,
  releaseEscrow,
  refundEscrow,
  getOrCreateWallet,
} from "../services/escrow.service.js";
import { logActivity } from "../services/activityLog.service.js";
import DealActivity from "../models/DealActivity.js";
import InfluencerProfile from "../models/InfluencerProfile.js";
import { notify } from "../services/notification.service.js";
import { checkAndRewardReferral } from '../services/referral.service.js';

export const createDeal = async (req, res) => {
  try {
    if (req.user.role !== 'brand') {
      return res.status(403).json({ error: { message: 'only brands can send offers' } });
    }
    const { influencerId, title, description, deliverables, priceMinor, deadline, sourceType, sourceId } = req.body;
    if (!influencerId || !title || priceMinor == null) {
      return res.status(400).json({ error: { message: 'influencerId , priceMinor and title is required' } });
    }

    const { brandFeeMinor, influencerFeeMinor, commissionMinor } = await computeFees(priceMinor);

    const deal = await Deal.create({
      brandId: req.user._id,
      influencerId,
      title, description, deliverables,
      priceMinor, brandFeeMinor, influencerFeeMinor,
      commissionMinor,
      deadline,
      sourceType: sourceType || 'custom',
      sourceId,
      status: 'draft',
    });

    await logActivity(deal._id, 'created', req.user._id, `Offer created: "${deal.title}"`);

    res.status(201).json({ deal });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const getDeals = async (req, res) => {
  try {
    const filter = req.user.role === 'brand'
      ? { brandId: req.user._id }
      : { influencerId: req.user._id };

    const deals = await Deal.find(filter)
      .populate('brandId', 'name')
      .populate('influencerId', 'name')
      .sort({ createdAt: -1 });

    res.json({ deals });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const getDealById = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id)
      .populate('brandId', 'name')
      .populate('influencerId', 'name');
    if (!deal) return res.status(404).json({ error: { message: 'Deal not Found' } });

    const uid = req.user._id.toString();

    const isParty =
      deal.brandId?._id?.toString() === uid ||
      deal.influencerId?._id?.toString() === uid;

    if (!isParty) {
      return res.status(403).json({
        error: { message: 'Not Authorized' },
        debug: { uid, brandId: deal.brandId, influencerId: deal.influencerId },
      });
    }

    res.json({ deal });
  } catch (error) {
    console.error('getDealById:', error);
    res.status(500).json({ error: { message: 'Server error' } });
  }
};

export const getDealActivity = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ error: { message: 'Deal not found' } });

    const uid = req.user._id.toString();
    const isParty =
      deal.brandId?.toString() === uid ||
      deal.influencerId?.toString() === uid ||
      req.user.role === 'admin';
    if (!isParty) return res.status(403).json({ error: { message: 'Not authorized' } });

    const activity = await DealActivity.find({ dealId: deal._id })
      .populate('actorId', 'name role')
      .sort({ createdAt: 1 });

    res.json({ activity });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const acceptDeal = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ error: { message: 'Deal Not Found' } });

    if (deal.influencerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'Only the influencer can accept this offer' } });
    }

    assertTransition(deal.status, 'agreed');
    deal.status = 'agreed';
    await deal.save();

    await logActivity(deal._id, 'accepted', req.user._id, 'Influencer accepted the offer');

    res.json({ deal });
  } catch (error) {
    res.status(error.status || 500).json({ error: { message: error.message } });
  }
};

export const fundDeal = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ error: { message: 'Deal not found' } });

    if (deal.brandId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'Only the brand can fund this deal' } });
    }

    assertTransition(deal.status, 'funded');

    await fundDealService(deal);

    deal.status = 'funded';
    await deal.save();

    await logActivity(deal._id, 'funded', req.user._id, 'Brand funded escrow');

    res.json({ deal });
  } catch (error) {
    res.status(error.status || 500).json({ error: { message: error.message } });
  }
};

export const startDeal = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ error: { message: 'Deal Not Found' } });

    const isParty =
      deal.brandId.toString() === req.user._id.toString() ||
      deal.influencerId.toString() === req.user._id.toString();
    if (!isParty) return res.status(403).json({ error: { message: 'Not authorized' } });

    assertTransition(deal.status, 'in_progress');
    deal.status = 'in_progress';
    await deal.save();

    await logActivity(deal._id, 'started', req.user._id, 'Work started');

    res.json({ deal });
  } catch (error) {
    res.status(error.status || 500).json({ error: { message: error.message } });
  }
};

export const deliverDeal = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ error: { message: 'Deal Not Found' } });

    if (deal.influencerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'Only Influencers can deliver' } });
    }

    assertTransition(deal.status, 'delivered');
    deal.status = 'delivered';
    deal.deliveryNote = req.body?.deliveryNote || '';

    // ✅ attach uploaded files, if any
    if (req.files?.length) {
      deal.deliveryFiles = req.files.map(f => `/uploads/deliveries/${f.filename}`);
    }

    await deal.save();
    await notify(
  deal.brandId,
  'deal_delivered',
  'Work delivered!',
  `The influencer has delivered work for "${deal.title}". Review it now.`,
  deal._id
);

    await logActivity(deal._id, 'delivered', req.user._id, deal.deliveryNote || 'Work delivered');

    res.json({ deal });
  } catch (error) {
    res.status(error.status || 500).json({ error: { message: error.message } });
  }
};

export const approveDeal = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ error: { message: 'Deal Not Found' } });

    if (deal.brandId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'Only the brand can approve' } });
    }

    assertTransition(deal.status, 'approved');

    await releaseEscrow(deal);

    deal.status = 'approved';
    await deal.save();

    await logActivity(deal._id, 'approved', req.user._id, 'Brand approved the work');

    res.json({ deal });
  } catch (error) {
    res.status(error.status || 500).json({ error: { message: error.message } });
  }
};
export const requestRevision = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ error: { message: 'Deal Not Found' } });

    if (deal.brandId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'Only the brand can request a revision' } });
    }

    assertTransition(deal.status, 'in_progress');
    deal.status = 'in_progress';
    deal.revisionNote = req.body?.revisionNote || '';
    await deal.save();

    await logActivity(deal._id, 'revision_requested', req.user._id, deal.revisionNote || 'Brand requested a revision');

    await notify(
      deal.influencerId,
      'revision_requested',
      'Revision requested',
      `The brand requested a revision on "${deal.title}": ${deal.revisionNote || 'No details provided'}`,
      deal._id
    );

    res.json({ deal });
  } catch (error) {
    res.status(error.status || 500).json({ error: { message: error.message } });
  }
};



export const cancelDeal = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ error: { message: 'Deal not found' } });

    const isParty =
      deal.brandId.toString() === req.user._id.toString() ||
      deal.influencerId.toString() === req.user._id.toString();
    if (!isParty) return res.status(403).json({ error: { message: 'Not authorized' } });

    assertTransition(deal.status, 'cancelled');

    if (deal.status === 'funded' || deal.status === 'in_progress' || deal.status === 'delivered') {
      await refundEscrow(deal);
    }

    deal.status = 'cancelled';
    await deal.save();

    await logActivity(deal._id, 'cancelled', req.user._id, 'Deal cancelled');

    res.json({ deal });
  } catch (err) {
    res.status(err.status || 500).json({ error: { message: err.message } });
  }
};

export const completeDeal = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ error: { message: 'Deal not found' } });

    const isParty =
      deal.brandId.toString() === req.user._id.toString() ||
      deal.influencerId.toString() === req.user._id.toString();
    if (!isParty) return res.status(403).json({ error: { message: 'Not authorized' } });

    assertTransition(deal.status, 'completed');
    deal.status = 'completed';
    await deal.save();

    await logActivity(deal._id, 'completed', req.user._id, 'Deal marked completed');

    await checkAndRewardReferral(deal._id, deal.brandId);
    await checkAndRewardReferral(deal._id, deal.influencerId);

    res.json({ deal });
  } catch (err) {
    res.status(err.status || 500).json({ error: { message: err.message } });
  }
};

export const getDealsTimeline = async (req, res) => {
  try {
    const isBrand = req.user.role == 'brand';
    const matchField = isBrand ? 'brandId' : "influencerId";
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const deals = await Deal.find({
      [matchField]: req.user._id,
      createdAt: { $gte: twelveMonthsAgo },
    }).select('createdAt priceMinor brandFeeMinor influencerFeeMinor status');

    const monthMap = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date(twelveMonthsAgo);
      d.setMonth(d.getMonth() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = { month: key, dealVolume: 0, moneyMinor: 0 };
    }

    for (const deal of deals) {
      const d = new Date(deal.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[key]) continue;

      monthMap[key].dealVolume += 1;

      const movedMoney = ['funded', 'in_progress', 'delivered', 'approved', 'completed', 'auto_released'].includes(deal.status);
      if (movedMoney) {
        monthMap[key].moneyMinor += isBrand
          ? deal.priceMinor + deal.brandFeeMinor
          : deal.priceMinor - deal.influencerFeeMinor;
      }
    }

    const timeline = Object.values(monthMap);

    res.json({ timeline, role: req.user.role });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const getWallet = async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.user._id);
    res.json({ wallet });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const depositTest = async (req, res) => {
  try {
    const { amountMinor } = req.body;
    if (!amountMinor || amountMinor <= 0) {
      return res.status(400).json({ error: { message: 'amountMinor must be positive' } });
    }

    const wallet = await getOrCreateWallet(req.user._id);
    wallet.balanceMinor += amountMinor;
    await wallet.save();

    await Ledger.create({
      userId: req.user._id,
      type: 'deposit',
      amountMinor,
      balanceAfterMinor: wallet.balanceMinor,
      description: 'Test deposit',
    });

    res.json({ wallet });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const requestCancellation = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ error: { message: "Deal not found" } });

    const isParty =
      deal.brandId.toString() === req.user._id.toString() ||
      deal.influencerId.toString() === req.user._id.toString();
    if (!isParty) return res.status(403).json({ error: { message: "Not authorized" } });

    if (["refunded", "cancelled", "completed"].includes(deal.status)) {
      return res.status(400).json({ error: { message: "This deal cant be cancelled" } });
    }
    if (deal.cancellationRequest?.status === "pending") {
      return res.status(400).json({ error: { message: "The Cancellation request is already pending" } });
    }

    const { reason } = req.body;
    if (!reason?.trim()) {
      return res.status(400).json({ error: { message: "A reason is required" } });
    }

    deal.cancellationRequest = {
      requestedBy: req.user._id,
      reason,
      requestedAt: new Date(),
      status: "pending",
    };
    await deal.save();

    await logActivity(deal._id, "cancellation_requested", req.user._id, reason);

    const otherPartyId =
      deal.brandId.toString() === req.user._id.toString() ? deal.influencerId : deal.brandId;
    await notify(
      otherPartyId,
      "offer_received",
      "Cancellation requested",
      `The other party has requested to cancel "${deal.title}". Reason: ${reason}`,
      deal._id
    );

    res.json({ deal });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const respondToCancellation = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ error: { message: "Deal not found" } });

    if (deal.cancellationRequest?.status !== "pending") {
      return res.status(400).json({ error: { message: "No pending cancellation request" } });
    }

    if (deal.cancellationRequest.requestedBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: { message: "you can't respond to your own request" } });
    }

    const { agree } = req.body;
    if (agree) {
      if (["funded", "in_progress", "delivered"].includes(deal.status)) {
        await refundEscrow(deal);
      }
      deal.status = "cancelled";
      deal.cancellationRequest.status = "agreed";
      await logActivity(deal._id, "cancelled", req.user._id, "Mutual cancellation agreed");
    } else {
      deal.cancellationRequest.status = "rejected";
      await logActivity(deal._id, "cancellation_rejected", req.user._id, "Cancellation request was rejected");
    }

    await deal.save();
    res.json({ deal });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const getWorkHistory = async (req, res) => {
  try {
    const profile = await InfluencerProfile.findOne({ handle: req.params.handle });
    if (!profile) return res.status(404).json({ error: { message: "Creator not found" } });

    const deals = await Deal.find({
      influencerId: profile.userId,
      status: { $in: ["completed", "auto_released"] },
    })
      .populate("brandId", "name")
      .select("title brandId updatedAt sourceType")
      .sort({ updatedAt: -1 })
      .limit(20);

    const workHistory = deals.map((d) => ({
      title: d.title,
      brandName: d.brandId?.name || "Brand",
      completedAt: d.updatedAt,
    }));

    res.json({ workHistory });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};