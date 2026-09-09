import Announcement from "../models/Announcement.js";

const TYPES = ['info', 'success', 'warning', 'danger'];
const AUDIENCES = ['all', 'brands', 'influencers'];
const EDITABLE = [
    'title', 'description', 'type', 'audience',
    'startAt', 'expiresAt', 'isDismissible',
    'ctaLabel', 'ctaUrl', 'isActive',
];

const validate = (body, { partial = false } = {}) => {
    if (!partial || body.title !== undefined) {
        if (!body.title || !String(body.title).trim()) return 'Title is required';
    }
    if (body.type !== undefined && !TYPES.includes(body.type)) {
        return 'Invalid announcement type';
    }
    if (body.audience !== undefined) {
        if (!Array.isArray(body.audience) || body.audience.length === 0) {
            return 'Pick at least one audience';
        }
        if (body.audience.some((a) => !AUDIENCES.includes(a))) {
            return 'Invalid audience';
        }
    }
    if (body.ctaUrl && !body.ctaLabel) {
        return 'Give the button a label, or remove the link';
    }
    if (body.startAt && body.expiresAt) {
        if (new Date(body.expiresAt) <= new Date(body.startAt)) {
            return 'Expiry must be after the start date';
        }
    }
    return null;
};

const pick = (body) => {
    const out = {};
    for (const key of EDITABLE) {
        if (body[key] !== undefined) out[key] = body[key];
    }
    // Empty datetime-local inputs arrive as "" — store null so the date
    // filters in activeAnnouncements behave.
    if (out.startAt === '') out.startAt = null;
    if (out.expiresAt === '') out.expiresAt = null;
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

        // Map your User.role values onto the audience vocabulary.
        // CHECK THIS against your actual role strings.
        const role = req.user?.role;
        const audienceKey =
            role === 'brand' ? 'brands'
                : role === 'influencer' ? 'influencers'
                    : null;

        if (!audienceKey) return res.json({ announcements: [] });

        const announcements = await Announcement.find({
            isActive: true,
            $and: [
                { $or: [{ startAt: null }, { startAt: { $lte: now } }] },
                { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
            ],
            audience: { $in: ['all', audienceKey] },
        })
            .select('title description type isDismissible ctaLabel ctaUrl updatedAt')
            .sort({ createdAt: -1 })
            .lean();

        res.json({ announcements });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};