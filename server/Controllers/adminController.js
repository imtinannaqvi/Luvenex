import User from '../models/User.js';
import Deal from '../models/Deal.js';
import Ledger from '../models/Ledger.js';
import Payout from '../models/Payout.js';
import Message from '../models/Message.js';
import ServiceRequest from '../models/ServiceRequest.js';
import Campaign from '../models/Campaign.js';
import Gig from '../models/Gig.js';
import { releaseEscrow } from '../services/escrow.service.js';
import { logActivity } from '../services/activityLog.service.js';
import BrandProfile from '../models/BrandProfile.js';
import InfluencerProfile from '../models/InfluencerProfile.js';
import Review from '../models/Review.js';
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalBrands,
      totalInfluencers,
      totalDeals,
      activeDeals,
      completedDeals,
      totalGigs,
      totalCampaigns,
      pendingKyc,
      pendingPayouts,
      flaggedMessages,
      pendingServiceRequests,
      commissionResult,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'brand' }),
      User.countDocuments({ role: 'influencer' }),
      Deal.countDocuments(),
      Deal.countDocuments({ status: { $in: ['funded', 'in_progress', 'delivered'] } }),
      Deal.countDocuments({ status: 'completed' }),
      Gig.countDocuments(),
      Campaign.countDocuments(),
      User.countDocuments({ 'kyc.status': 'pending' }),
      Payout.countDocuments({ status: 'pending' }),
      Message.countDocuments({ isFlagged: true }),
      ServiceRequest.countDocuments({ status: 'pending' }),
      Ledger.aggregate([
        { $match: { type: 'commission' } },
        { $group: { _id: null, total: { $sum: '$amountMinor' } } },
      ]),
    ]);

    res.json({
      stats: {
        users: { total: totalUsers, brands: totalBrands, influencers: totalInfluencers },
        deals: { total: totalDeals, active: activeDeals, completed: completedDeals },
        marketplace: { gigs: totalGigs, campaigns: totalCampaigns },
        commissionEarnedMinor: commissionResult[0]?.total || 0,
        queues: {
          pendingKyc,
          pendingPayouts,
          flaggedMessages,
          pendingServiceRequests,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const getAdminTimeline = async (req, res) => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const [users, deals, commissionEntries] = await Promise.all([
      User.find({ createdAt: { $gte: twelveMonthsAgo } }).select('createdAt'),
      Deal.find({ createdAt: { $gte: twelveMonthsAgo } }).select('createdAt status'),
      Ledger.find({ type: 'commission', createdAt: { $gte: twelveMonthsAgo } }).select('createdAt amountMinor'),
    ]);

    const monthMap = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date(twelveMonthsAgo);
      d.setMonth(d.getMonth() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = { month: key, newUsers: 0, newDeals: 0, revenueMinor: 0 };
    }

    const keyFor = (date) => {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    for (const u of users) {
      const key = keyFor(u.createdAt);
      if (monthMap[key]) monthMap[key].newUsers += 1;
    }
    for (const d of deals) {
      const key = keyFor(d.createdAt);
      if (monthMap[key]) monthMap[key].newDeals += 1;
    }
    for (const c of commissionEntries) {
      const key = keyFor(c.createdAt);
      if (monthMap[key]) monthMap[key].revenueMinor += c.amountMinor;
    }

    res.json({ timeline: Object.values(monthMap) });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const getUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.q) {
      const regex = new RegExp(req.query.q, 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const getUserDetail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({ error: { message: "User not found" } });

    const [dealCount, payouts, ledgerEntries] = await Promise.all([
      Deal.countDocuments({ $or: [{ brandId: user._id }, { influencerId: user._id }] }),
      Payout.find({ userId: user._id }).sort({ createdAt: -1 }).limit(10),
      Ledger.find({ userId: user._id }).sort({ createdAt: -1 }).limit(20),
    ]);

    res.json({ user, activity: { dealCount, recentPayouts: payouts, recentLedger: ledgerEntries } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};
export const getUserStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    if (!['active', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({ error: { message: "Status must be active, suspended, or banned" } });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: { message: "User not found" } });

    if (user.role === 'admin') {
      return res.status(400).json({ error: { message: "Cannot change status of an admin account" } });
    }

    user.status = status;
    user.statusReason = status === 'active' ? undefined : (reason || "No reason provided");
    user.statusChangedAt = new Date();
    await user.save();

    res.json({ user: { id: user._id, name: user.name, email: user.email, status: user.status, statusReason: user.statusReason } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const getAllDeals = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [deals, total] = await Promise.all([
      Deal.find(filter)
        .populate('brandId', 'name email')
        .populate('influencerId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Deal.countDocuments(filter),
    ]);

    res.json({
      deals,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const adminReleaseEscrow = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ error: { message: 'Deal not found' } });

    if (!['funded', 'in_progress', 'delivered', 'disputed'].includes(deal.status)) {
      return res.status(400).json({ error: { message: `Cannot release a deal with status ${deal.status}` } });
    }

    await releaseEscrow(deal);
    deal.status = 'completed';
    await deal.save();

    await logActivity(
      deal._id,
      'admin_released',
      req.user._id,
      `Admin manually released escrow: ${req.body.reason || 'no reason given'}`
    );

    res.json({ deal });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const getLedger = async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      Ledger.find(filter)
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Ledger.countDocuments(filter),
    ]);

    res.json({
      entries,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const getKycQueue = async (req, res) => {
  try {
    const users = await User.find({ 'kyc.status': 'pending' })
      .select('name email role kyc')
      .sort({ 'kyc.submittedAt': 1 });

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const getPayOutQueue = async (req, res) => {
  try {
    const payouts = await Payout.find({ status: 'pending' })
      .populate('userId', 'name email kyc.status')
      .sort({ createdAt: -1 });

    res.json({ payouts });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const getReferralOverview = async (req, res) => {
  try {
    const referrers = await User.find({ referralRewardsEarnedMinor: { $gt: 0 } })
      .select('name email role referralCode referralRewardsEarnedMinor')
      .sort({ referralRewardsEarnedMinor: -1 });

    const allReferrals = await User.find({ referredBy: { $exists: true, $ne: null } })
      .populate('referredBy', 'name email role')
      .select('name email role referredBy createdAt')
      .sort({ createdAt: -1 });

    res.json({ topReferrers: referrers, allReferrals });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const getVerificationQueue = async (req, res) => {
  try {
    const users = await User.find({ 'verificationRequest.status': 'pending' })
      .select('name email role verificationRequest');
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const reviewVerification = async (req, res) => {
  try {
    const { decision, rejectionReason } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: { message: 'User not found' } });

    user.verificationRequest.status = decision;
    user.verificationRequest.reviewedAt = new Date();
    if (decision === 'rejected') user.verificationRequest.rejectionReason = rejectionReason;
    await user.save();

    if (decision === 'approved') {
      const Model = user.role === 'brand' ? BrandProfile : InfluencerProfile;
      await Model.findOneAndUpdate({ userId: user._id }, { isVerified: true });
    }

    res.json({ message: `Verification ${decision}` });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const getPendingReviews = async(req,res) => {
  try {
    const reviews = await Review.find({ status:'pending'})
    .populate('reviewerId','name')
    .populate('revieweeId','name')
    .sort({ createdAt: -1})
    res.json({ reviews})
  } catch (error) {
    res.stats(500).json({error:{ message: error.message}})
    
  }
}

export const modrateReviews = async (req,res) => {
  try {
    const {decision} = req.body;
    const review = await Review.findById(req.params.id)
    if(!review) return res.status(404).json({ error:{ message:"Review not found"}})
      review.status = decision;
    await review.save()

    if(decision === 'published') {
      await updateAvgRating(review.revieweeId)
    }
    res.json({ review})

  } catch (error) {
    res.status(500).json({ error:{ message: error.message}})
    
  }
}