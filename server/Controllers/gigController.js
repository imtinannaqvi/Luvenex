import Gig from "../models/Gig.js";
import InfluencerProfile from "../models/InfluencerProfile.js";

export const createGig = async (req, res) => {
  try {
    if (req.user.role !== 'influencer') {
      return res.status(403).json({ error: { message: "Only influencers can create gigs" } });
    }

    const { title, description, deliverablesJson, priceMinor, deliveryDays, revisions, category } = req.body;

    if (!title || priceMinor == null || deliveryDays == null) {
      return res.status(400).json({ error: { message: 'Title, priceMinor, and deliveryDays are required' } });
    }

    const gig = await Gig.create({
      influencerId: req.user._id,
      title,
      description,
      deliverablesJson,
      priceMinor,
      deliveryDays,
      revisions,
      category,
    });

    res.status(201).json({ gig });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};


export const getGigs = async (req, res) => {
  try {
    const filter = { status: 'active' };
    if (req.query.category) {
      filter.category = new RegExp(req.query.category, 'i');
    }
    if (req.query.influencerId) filter.influencerId = req.query.influencerId;

    const gigs = await Gig.find(filter)
      .populate('influencerId', 'name')
      .sort({ createdAt: -1 });

    const gigsWithHandles = await Promise.all(
      gigs.map(async (g) => {
        const gigObj = g.toObject();
               if (gigObj.influencerId?._id) {
          const profile = await InfluencerProfile.findOne({ userId: gigObj.influencerId._id }).select('handle avatarUrl portfolio')
          gigObj.influencerId.handle = profile?.handle || null;
          gigObj.influencerId.avatarUrl = profile?.avatarUrl || null;
          gigObj.influencerId.portfolio = profile?.portfolio || [];
        }
        return gigObj;
      })
    );

    res.json({ gigs: gigsWithHandles });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};


export const getMyGigs = async (req, res) => {
  try {
    if (req.user.role !== 'influencer') {
      return res.status(403).json({ error: { message: 'Only influencers can view their gigs' } });
    }

    const filter = { influencerId: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const gigs = await Gig.find(filter).sort({ createdAt: -1 });

    res.json({ gigs });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

// GET /api/gigs/:id — public single gig
export const getGigById = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id).populate('influencerId', 'name');
    if (!gig) return res.status(404).json({ error: { message: "Gig not found" } });

    const gigObj = gig.toObject();
    if (gigObj.influencerId?._id) {
      const profile = await InfluencerProfile.findOne({
        userId: gigObj.influencerId._id,
      }).select('handle avatarUrl portfolio');
      gigObj.influencerId.handle = profile?.handle || null;
      gigObj.influencerId.avatarUrl = profile?.avatarUrl || null;
      gigObj.influencerId.portfolio = profile?.portfolio || [];
    }

    res.json({ gig: gigObj });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

// PATCH /api/gigs/:id — influencer edits their OWN gig
export const updateGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ error: { message: 'Gig not found' } });

    // ownership check — only the owner can edit
    if (gig.influencerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'You can only edit your own gigs' } });
    }

    const allowed = ['title', 'description', 'deliverablesJson', 'priceMinor', 'deliveryDays', 'revisions', 'category', 'status'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) gig[key] = req.body[key];
    }
    await gig.save();

    res.json({ gig });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

// DELETE /api/gigs/:id — influencer deletes their OWN gig
export const deleteGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ error: { message: 'Gig not found' } });

    if (gig.influencerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'You can only delete your own gigs' } });
    }

    await gig.deleteOne();
    res.json({ message: "Gig deleted" });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};