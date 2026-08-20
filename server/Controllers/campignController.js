import Campaign from "../models/Campaign.js";
import User from "../models/User.js";                 // 👈 to find influencers
import Notification from "../models/Notification.js";  // 👈 to broadcast in one write

export const createCampign = async (req, res) => {
    try {
        if (req.user.role !== 'brand') {
            return res.status(403).json({ error: { message: "Only brands can create Campign" } });
        }

        const { title, description, goals, budgetMinMinor, budgetMaxMinor, criteriaJson, deliverablesJson, category, deadline } = req.body;
        if (!title) {
            return res.status(400).json({ error: { message: "Title is Required" } });
        }

        const campaign = await Campaign.create({
            brandId: req.user._id,
            title, description, category, goals, budgetMinMinor, budgetMaxMinor,
            deadline, criteriaJson, deliverablesJson,
        });

        // ── Broadcast a notification to all active influencers (best-effort) ──
        // NOTE: this notifies every influencer. Fine at your current size, but
        // once you have many influencers, refine this to target by niche/category
        // to avoid noise and large write bursts.
        try {
            const influencers = await User.find({
                role: 'influencer',
                status: 'active',
            }).select('_id');

            if (influencers.length) {
                await Notification.insertMany(
                    influencers.map((inf) => ({
                        userId: inf._id,
                        type: 'new_campaign',
                        title: 'New campaign posted!',
                        message: `A new campaign "${campaign.title}" was just posted. Check it out.`,
                        relatedId: campaign._id,
                    }))
                );

                // Optional: push live so online influencers see it instantly.
                // Their NotificationsProvider listens for "notification" and will
                // toast + refresh the bell. Remove this block if you'd rather the
                // notification just appear on the next poll (within ~30s).
                const io = req.app.get('io');
                if (io) {
                    influencers.forEach((inf) => {
                        io.to(inf._id.toString()).emit('notification', {
                            type: 'new_campaign',
                            title: 'New campaign posted!',
                            message: `A new campaign "${campaign.title}" was just posted. Check it out.`,
                            relatedId: campaign._id.toString(),
                        });
                    });
                }
            }
        } catch (notifyErr) {
            console.warn('campaign broadcast notify failed:', notifyErr.message);
        }

        res.status(201).json({ campaign });
    } catch (error) {
        return res.status(500).json({ error: { message: error.message } });
    }
};

export const getCampaigns = async (req, res) => {
  try {
    const filter = {};

    // if a specific brandId is requested, this is the brand viewing THEIR OWN campaigns —
    // show all statuses. Otherwise, this is public browsing — only show open ones.
    if (req.query.brandId) {
      filter.brandId = req.query.brandId;
    } else {
      filter.status = 'open';
    }

    if (req.query.category) filter.category = req.query.category;

    const campaigns = await Campaign.find(filter)
      .populate('brandId', 'name status')
      .sort({ createdAt: -1 });

    const validCampaigns = campaigns.filter(
      (c) => c.brandId != null && !['banned', 'suspended'].includes(c.brandId.status)
    );

    res.json({ campaigns: validCampaigns });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

// Brand dashboard listing — ALWAYS scoped to the logged-in brand, all statuses included.
export const getMyCampaigns = async (req, res) => {
  try {
    if (req.user.role !== 'brand') {
      return res.status(403).json({ error: { message: 'Only brands can view their campaigns' } });
    }

    const filter = { brandId: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const campaigns = await Campaign.find(filter)
      .populate('brandId', 'name')
      .sort({ createdAt: -1 });

    res.json({ campaigns });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate('brandId', 'name');
    if (!campaign) return res.status(404).json({ error: { message: 'Campaign not found' } });
    res.json({ campaign });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: { message: 'Campaign not found' } });

    // ownership check
    if (campaign.brandId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'You can only edit your own campaigns' } });
    }

    const allowed = ['title', 'goals', 'description', 'budgetMinMinor', 'budgetMaxMinor', 'criteriaJson', 'category', 'deadline', 'status'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) campaign[key] = req.body[key];
    }
    await campaign.save();

    res.json({ campaign });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: { message: 'Campaign not found' } });

    if (campaign.brandId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'You can only delete your own campaigns' } });
    }

    await campaign.deleteOne();
    res.json({ message: 'Campaign deleted' });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};