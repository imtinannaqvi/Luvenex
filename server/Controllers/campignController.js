import Campaign from "../models/Campaign.js";

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
        res.status(201).json({ campaign });
    } catch (error) {
        return res.status(500).json({ error: { message: error.message } });
    }
};

export const getCampaigns = async (req, res) => {
  try {
    const filter = { status: 'open' };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.brandId) filter.brandId = req.query.brandId;

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