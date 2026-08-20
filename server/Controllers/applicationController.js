import Application from '../models/Application.js';
import Campaign from '../models/Campaign.js';
import Deal from '../models/Deal.js';
import { computeFees } from '../lib/money.js';
import InfluencerProfile from '../models/InfluencerProfile.js';
import { notify } from '../services/notification.service.js'; // ⚠️ adjust path if different

// Small helper: push a live "notification" socket event to a user's personal
// room (so online users get the instant toast + bell refresh). Safe no-op if
// io isn't available.
const pushLive = (req, userId, payload) => {
  try {
    const io = req.app.get('io');
    if (io) io.to(userId.toString()).emit('notification', payload);
  } catch (e) {
    console.warn('live notification push failed:', e.message);
  }
};

export const applyToCampaign = async (req, res) => {
  try {
    if (req.user.role !== 'influencer') {
      return res.status(403).json({ error: { message: 'Only influencers can apply to campaigns' } });
    }

    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: { message: 'Campaign not found' } });
    if (campaign.status !== 'open') {
      return res.status(400).json({ error: { message: 'This campaign is not open for applications' } });
    }

    const { proposalText, proposedPriceMinor, proposedDeliveryDays, attachedPortfolioItemId } = req.body;
    if (!proposalText) {
      return res.status(400).json({ error: { message: 'Proposal text is required' } });
    }

    const application = await Application.create({
      campaignId: campaign._id,
      influencerId: req.user._id,
      proposalText,
      proposedPriceMinor,
      proposedDeliveryDays,
      attachedPortfolioItemId,
    });

    // ── Notify the BRAND who owns this campaign ──
    // Routes to the brand's "Campaigns" sidebar link (/app/campaigns).
    try {
      const applicantName = req.user.name || 'An influencer';
      const title = 'New application received';
      const message = `${applicantName} applied to "${campaign.title}".`;
      await notify(campaign.brandId, 'application_received', title, message, campaign._id);
      pushLive(req, campaign.brandId, {
        type: 'application_received',
        title,
        message,
        relatedId: campaign._id.toString(),
      });
    } catch (notifyErr) {
      console.warn('apply notify failed:', notifyErr.message);
    }

    res.status(201).json({ application });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: { message: 'You have already applied to this campaign' } });
    }
    res.status(500).json({ error: { message: err.message } });
  }
};

export const updateApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ error: { message: 'Application not found' } });

    if (application.influencerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'You can only edit your own applications' } });
    }
    if (application.status !== 'pending') {
      return res.status(400).json({ error: { message: 'Only pending applications can be edited' } });
    }

    const { proposalText, proposedPriceMinor, proposedDeliveryDays } = req.body;
    if (proposalText !== undefined) application.proposalText = proposalText;
    if (proposedPriceMinor !== undefined) application.proposedPriceMinor = proposedPriceMinor;
    if (proposedDeliveryDays !== undefined) application.proposedDeliveryDays = proposedDeliveryDays;

    await application.save();
    res.json({ application });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const getCampaignApplications = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: { message: 'Campaign not found' } });
    if (campaign.brandId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'Not authorized' } });
    }

    const applications = await Application.find({ campaignId: campaign._id })
      .populate('influencerId', 'name email')
      .sort({ createdAt: -1 });

    const enriched = await Promise.all(
      applications.map(async (app) => {
        if (!app.attachedPortfolioItemId) return app.toObject();
        const profile = await InfluencerProfile.findOne({ userId: app.influencerId._id });
        const item = profile?.portfolio?.id(app.attachedPortfolioItemId);
        return { ...app.toObject(), attachedPortfolioItem: item || null };
      })
    );

    res.json({ applications: enriched });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const acceptApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate('campaignId');
    if (!application) return res.status(404).json({ error: { message: 'Application not found' } });

    if (application.campaignId.brandId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'Not authorized' } });
    }

    application.status = 'accepted';
    await application.save();

    // automatically create the deal from this accepted application
    const priceMinor = application.proposedPriceMinor || application.campaignId.budgetMinMinor || 0;
    const { brandFeeMinor, influencerFeeMinor, commissionMinor } = await computeFees(priceMinor);

    const deal = await Deal.create({
      brandId: application.campaignId.brandId,
      influencerId: application.influencerId,
      title: application.campaignId.title,
      description: application.campaignId.description,
      priceMinor,
      brandFeeMinor,
      influencerFeeMinor,
      commissionMinor,
      deadline: application.campaignId.deadline,
      sourceType: 'campaign',
      sourceId: application.campaignId._id,
      status: 'agreed',
    });

    // ── Notify the INFLUENCER that their application was accepted ──
    try {
      const title = 'Application accepted 🎉';
      const message = `Your application for "${application.campaignId.title}" was accepted.`;
      await notify(application.influencerId, 'application_accepted', title, message, application.campaignId._id);
      pushLive(req, application.influencerId, {
        type: 'application_accepted',
        title,
        message,
        relatedId: application.campaignId._id.toString(),
      });
    } catch (notifyErr) {
      console.warn('accept notify failed:', notifyErr.message);
    }

    res.json({ application, deal });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const rejectApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate('campaignId');
    if (!application) return res.status(404).json({ error: { message: 'Application not found' } });

    if (application.campaignId.brandId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'Not authorized' } });
    }

    application.status = 'rejected';
    await application.save();

    // ── Notify the INFLUENCER that their application was rejected ──
    try {
      const title = 'Application update';
      const message = `Your application for "${application.campaignId.title}" was not selected.`;
      await notify(application.influencerId, 'application_rejected', title, message, application.campaignId._id);
      pushLive(req, application.influencerId, {
        type: 'application_rejected',
        title,
        message,
        relatedId: application.campaignId._id.toString(),
      });
    } catch (notifyErr) {
      console.warn('reject notify failed:', notifyErr.message);
    }

    res.json({ application });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ influencerId: req.user._id })
      .populate('campaignId', 'title status')
      .sort({ createdAt: -1 });
    res.json({ applications });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};