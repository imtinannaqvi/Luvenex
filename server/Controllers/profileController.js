import BrandProfile from "../models/BrandProfile.js";
import InfluencerProfile from "../models/InfluencerProfile.js";
import Deal from "../models/Deal.js";
import User from '../models/User.js';
import fs from 'fs';

export const getInfluencerByHandle = async (req, res) => {
  try {
    const profile = await InfluencerProfile.findOne({ handle: req.params.handle.toLowerCase() })
      .populate('userId', 'name email status');
    if (!profile) {
      return res.status(404).json({ error: { message: "Profile not Found" } });
    }
    res.json({ profile });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const updateInfluencerMe = async (req, res) => {
  try {
     console.log("incoming body:", req.body);   // ← add this line here
    console.log("socialAccounts received:", req.body.socialAccounts);
    if (req.user.role !== 'influencer') {
      return res.status(403).json({ error: { message: 'Only influencers can edit an influencer profile' } });
    }

const allowed = ['handle', 'bio', 'niches', 'rateCardJson', 'socialAccounts', 'skills', 'languages'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (updates.handle) updates.handle = updates.handle.toLowerCase();

    const profile = await InfluencerProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updates, $setOnInsert: { userId: req.user._id } },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ profile });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: { message: 'That handle is already taken' } });
    }
    res.status(500).json({ error: { message: err.message } });
  }
};

export const getBrandByHandle = async (req, res) => {
  try {
    const profile = await BrandProfile.findOne({ handle: req.params.handle.toLowerCase() })
      .populate('userId', 'name email status');
    if (!profile) {
      return res.status(404).json({ error: { message: 'Brand not Found' } });
    }
    res.json({ profile });
  } catch (error) {
    return res.status(500).json({ error: { message: error.message } });
  }
};

export const updateBrandMe = async (req, res) => {
  try {
    if (req.user.role !== 'brand') {
      return res.status(403).json({ error: { message: 'Only brands can edit a brand profile' } });
    }

    const allowed = ['handle', 'companyName', 'industry', 'website', 'bio'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (updates.handle) updates.handle = updates.handle.toLowerCase();

    const profile = await BrandProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updates, $setOnInsert: { userId: req.user._id } },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ profile });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: { message: 'That handle is already taken' } });
    }
    res.status(500).json({ error: { message: err.message } });
  }
};

export const searchInfluencers = async (req, res) => {
  try {
    const filter = {};

    if (req.query.niche) filter.niches = req.query.niche;
    if (req.query.minFollowers) filter.followersCount = { $gte: Number(req.query.minFollowers) };
    if (req.query.minRating) filter.avgRating = { $gte: Number(req.query.minRating) };
    if (req.query.q) {
      const regex = new RegExp(req.query.q, 'i');
      filter.$or = [{ bio: regex }, { handle: regex }];
    }

    // ✅ exclude users who've hidden themselves from search
    const hiddenUsers = await User.find({ 'privacySettings.hideFromSearch': true }).select('_id');
    const hiddenUserIds = hiddenUsers.map((u) => u._id);
    if (hiddenUserIds.length > 0) {
      filter.userId = { $nin: hiddenUserIds };
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let sort = { createdAt: -1 };
    if (req.query.sort === 'rating') sort = { avgRating: -1 };
    if (req.query.sort === 'followers') sort = { followersCount: -1 };

    const [profiles, total] = await Promise.all([
      InfluencerProfile.find(filter)
        .populate('userId', 'name status')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      InfluencerProfile.countDocuments(filter),
    ]);

    const profilesWithDeals = await Promise.all(
      profiles.map(async (p) => {
        const dealCount = await Deal.countDocuments({
          influencerId: p.userId?._id,
          status: 'completed',
        });
        return { ...p.toObject(), completedDeals: dealCount };
      })
    );

    res.json({
      profiles: profilesWithDeals,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

const profileModelForRole = (role) => {
  if (role === 'influencer') return InfluencerProfile;
  if (role === 'brand') return BrandProfile;
  return null;
};

export const addPortfolioItem = async (req, res) => {
  try {
    const Model = profileModelForRole(req.user.role);

    if (!Model) {
      return res.status(403).json({
        error: {
          message: "Only influencers and brands have portfolios",
        },
      });
    }

    const { title, description } = req.body || {};

    // Validate title
    if (!title?.trim()) {
      return res.status(400).json({
        error: {
          message: "title is required",
        },
      });
    }

    // Validate uploaded file
    if (!req.file) {
      return res.status(400).json({
        error: {
          message: "media file is required",
        },
      });
    }

    /*
     * Multer gives us the uploaded file in req.file.
     *
     * Depending on your upload middleware, the file URL may be
     * available through filename/path.
     */

    const mediaUrl = req.file.path
      ? `/${req.file.path.replace(/\\/g, "/").replace(/^\/+/, "")}`
      : req.file.filename
        ? `/uploads/${req.file.filename}`
        : null;

    if (!mediaUrl) {
      return res.status(400).json({
        error: {
          message: "Could not determine uploaded media URL",
        },
      });
    }

    // Detect image/video from MIME type
    let mediaType = "image";

    if (req.file.mimetype?.startsWith("video/")) {
      mediaType = "video";
    } else if (req.file.mimetype?.startsWith("image/")) {
      mediaType = "image";
    }

    console.log("Portfolio body:", req.body);
    console.log("Portfolio file:", req.file);
    console.log("Portfolio media URL:", mediaUrl);
    console.log("Portfolio media type:", mediaType);

    const profile = await Model.findOneAndUpdate(
      { userId: req.user._id },
      {
        $push: {
          portfolio: {
            title: title.trim(),
            description: description?.trim() || "",
            mediaType,
            mediaUrl,
          },
        },
        $setOnInsert: {
          userId: req.user._id,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return res.status(201).json({
      portfolio: profile.portfolio,
    });
  } catch (err) {
    console.error("addPortfolioItem:", err);

    return res.status(500).json({
      error: {
        message: err.message || "Failed to add portfolio item",
      },
    });
  }
};

export const updatePortfolioItem = async (req, res) => {
  try {
    const Model = profileModelForRole(req.user.role);
    if (!Model) {
      return res.status(403).json({ error: { message: 'Only influencers and brands have portfolios' } });
    }

    const profile = await Model.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ error: { message: 'Profile not found' } });

    const item = profile.portfolio.id(req.params.itemId);
    if (!item) return res.status(404).json({ error: { message: 'Portfolio item not found' } });

    const allowed = ['title', 'description'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) item[key] = req.body[key];
    }

    if (req.file) {
      const oldPath = `.${item.mediaUrl}`;
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

      item.mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
      item.mediaUrl = `/uploads/portfolio/${req.file.filename}`;
    }

    await profile.save();

    res.json({ portfolio: profile.portfolio });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const deletePortfolioItem = async (req, res) => {
  try {
    const Model = profileModelForRole(req.user.role);
    if (!Model) {
      return res.status(403).json({ error: { message: 'Only influencers and brands have portfolios' } });
    }

    const profile = await Model.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ error: { message: 'Profile not found' } });

    const item = profile.portfolio.id(req.params.itemId);
    if (!item) return res.status(404).json({ error: { message: 'Portfolio item not found' } });

    const filePath = `.${item.mediaUrl}`;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    item.deleteOne();
    await profile.save();

    res.json({ portfolio: profile.portfolio });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const updateAvatar = async (req, res) => {
  try {
    const Model = profileModelForRole(req.user.role);
    if (!Model) {
      return res.status(403).json({ error: { message: 'Only influencers and brands have profiles' } });
    }

    if (!req.file) {
      return res.status(400).json({ error: { message: 'An image file is required (field name: avatar)' } });
    }

    let profile = await Model.findOne({ userId: req.user._id });
    if (!profile) {
      profile = await Model.create({ userId: req.user._id });
    }

    if (profile.avatarUrl) {
      const oldPath = `.${profile.avatarUrl}`;
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    profile.avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await profile.save();

    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const getMyInfluencerProfile = async (req, res) => {
  try {
    if (req.user.role !== 'influencer') {
      return res.status(403).json({ error: { message: 'Only influencers can access this' } });
    }
    const profile = await InfluencerProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ error: { message: 'Profile not set up yet' } });
    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const getMyBrandProfile = async (req, res) => {
  try {
    if (req.user.role !== 'brand') {
      return res.status(403).json({ error: { message: 'Only brands can access this' } });
    }
    const profile = await BrandProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ error: { message: 'Profile not set up yet' } });
    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const uploadCover = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: { message: 'No file' } });

    const coverUrl = `/uploads/covers/${req.file.filename}`;   // ✅ matches the new folder
    const Model = req.user.role === 'brand' ? BrandProfile : InfluencerProfile;

    const profile = await Model.findOneAndUpdate(
      { userId: req.user._id },
      { coverUrl },
      { returnDocument: 'after' }   // also fixes the deprecation warning you're seeing
    );

    if (!profile) {
      return res.status(404).json({ error: { message: 'Profile not found — create your profile first' } });
    }

    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};