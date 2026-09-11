import Announcement from "../models/Announcement.js";

const TYPES = ['info', 'success', 'warning', 'danger'];
const AUDIENCES = ['all', 'brands', 'influencers'];

const validate = (body, { partial = false } = {}) => {
    if (!partial || body.title !== undefined) {
        if (!body.title || !String(body.title).trim()) return 'Title is required';
    }
    if (!partial || body.message !== undefined) {
        if (!body.message || !String(body.message).trim()) return 'Message is required';
    }
    if (body.type !== undefined && !TYPES.includes(body.type)) {
        return 'Invalid announcement type';
    }
    if (body.audience !== undefined && !AUDIENCES.includes(body.audience)) {
        return 'Invalid audience';
    }
    return null;
};

const pick = (body) => {
    const out = {};
    for (const key of ['title', 'message', 'type', 'audience', 'isActive']) {
        if (body[key] !== undefined) out[key] = body[key];
    }

    if (body.expiresAt !== undefined) {
        if (!body.expiresAt) {
            out.expiresAt = null;
        } else {
            // The form sends a date with no time ("2026-09-15"). Push it to the
            // end of that day so an announcement expiring "today" stays up all
            // day instead of vanishing at midnight.
            const d = new Date(body.expiresAt);
            if (!Number.isNaN(d.getTime())) {
                d.setHours(23, 59, 59, 999);
                out.expiresAt = d;
            }
        }
    }

    return out;
};

export const listAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ createdAt: -1 }).lean();
        res.json({ announcements });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};

export const createAnnouncement = async (req, res) => {
    try {
        const invalid = validate(req.body);
        if (invalid) return res.status(400).json({ error: { message: invalid } });

        const announcement = await Announcement.create({
            ...pick(req.body),
            createdBy: req.user._id,
        });
        res.status(201).json({ announcement });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};

export const updateAnnouncement = async (req, res) => {
    try {
        const invalid = validate(req.body, { partial: true });
        if (invalid) return res.status(400).json({ error: { message: invalid } });

        const announcement = await Announcement.findByIdAndUpdate(
            req.params.id,
            pick(req.body),
            { new: true, runValidators: true }
        );
        if (!announcement) {
            return res.status(404).json({ error: { message: 'Announcement not found' } });
        }
        res.json({ announcement });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};

export const deleteAnnouncement = async (req, res) => {
    try {
        const deleted = await Announcement.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: { message: 'Announcement not found' } });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};

/**
 * Public. Returns only what this visitor should see right now.
 * Mount behind optionalAuth so req.user exists when a token is sent but the
 * route still answers logged-out visitors.
 */
export const activeAnnouncements = async (req, res) => {
    try {
        const now = new Date();

        // Only brands and influencers are a banner audience. Logged-out
        // visitors and admins get nothing.
        // CHECK these role strings against your User model's role enum.
        const role = req.user?.role;
        const audienceKey =
            role === 'brand' ? 'brands'
                : role === 'influencer' ? 'influencers'
                    : null;

        if (!audienceKey) return res.json({ announcements: [] });

        const announcements = await Announcement.find({
            isActive: true,
            audience: { $in: ['all', audienceKey] },
            $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
        })
            .select('title message type updatedAt')
            .sort({ createdAt: -1 })
            .lean();

        res.json({ announcements });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};