import Branding from "../models/Branding.js";
import { removeUpload } from "../middleware/upload.js";

const IMAGE_KEYS = ['logo', 'favicon'];

// Read on every public page load, so hold it briefly in memory.
let cache = null;
let cachedAt = 0;
const TTL = 60 * 1000;

const safeParse = (value, fallback) => {
    if (!value) return fallback;
    if (typeof value === 'object') return value;
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
};

export const getBranding = async (req, res) => {
    try {
        if (cache && Date.now() - cachedAt < TTL) {
            return res.json({ branding: cache });
        }
        const branding = await Branding.getBranding();
        cache = branding.toObject();
        cachedAt = Date.now();
        res.json({ branding: cache });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};

export const updateBranding = async (req, res) => {
    try {
        const branding = await Branding.getBranding();

        // Images the admin cleared with the X button.
        const removeImages = safeParse(req.body.removeImages, []);
        if (Array.isArray(removeImages)) {
            for (const key of removeImages.filter((k) => IMAGE_KEYS.includes(k))) {
                removeUpload(branding[key]);
                branding[key] = null;
            }
        }

        // New uploads replace what was there, and the old file is unlinked so
        // the uploads folder doesn't grow forever.
        for (const key of IMAGE_KEYS) {
            const file = req.files?.[key]?.[0];
            if (!file) continue;
            removeUpload(branding[key]);
            branding[key] = `/uploads/branding/${file.filename}`;
        }

        branding.updatedBy = req.user._id;
        await branding.save();

        cache = null;
        cachedAt = 0;

        res.json({ branding });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};