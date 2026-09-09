import Branding from "../models/Branding.js";
import { removeUpload } from "../middleware/upload.js";

const IMAGE_KEYS = ['logo', 'logoDark', 'favicon', 'ogImage'];
const SOCIAL_KEYS = ['facebook', 'instagram', 'tiktok', 'linkedin', 'youtube'];
const HEX = /^#[0-9a-fA-F]{6}$/;

// Branding is read on every public page load, so hold it briefly in memory.
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
        const changes = {};

        const track = (key, value) => {
            if (String(branding[key]) === String(value)) return;
            changes[key] = { from: branding[key], to: value };
            branding[key] = value;
        };

        if (req.body.platformName !== undefined) track('platformName', req.body.platformName);
        if (req.body.tagline !== undefined) track('tagline', req.body.tagline);

        for (const key of ['primaryColor', 'primaryDark']) {
            const value = req.body[key];
            if (value === undefined) continue;
            if (!HEX.test(value)) {
                return res.status(400).json({
                    error: { message: `${key} must be a hex value like #1A2B3C` },
                });
            }
            track(key, value);
        }

        // Arrives as a JSON string because the client sends FormData.
        const socials = safeParse(req.body.socials, null);
        if (socials) {
            for (const key of SOCIAL_KEYS) {
                if (socials[key] === undefined) continue;
                const value = String(socials[key]).trim();
                if (branding.socials[key] !== value) {
                    changes[`socials.${key}`] = { from: branding.socials[key], to: value };
                    branding.socials[key] = value;
                }
            }
        }

        // Images the admin cleared with the X button.
        const removeImages = safeParse(req.body.removeImages, []);
        if (Array.isArray(removeImages)) {
            for (const key of removeImages.filter((k) => IMAGE_KEYS.includes(k))) {
                removeUpload(branding[key]);
                changes[key] = { from: branding[key], to: null };
                branding[key] = null;
            }
        }

        // Newly uploaded files replace whatever was there, and the old file is
        // unlinked so the uploads folder doesn't grow forever.
        for (const key of IMAGE_KEYS) {
            const file = req.files?.[key]?.[0];
            if (!file) continue;
            removeUpload(branding[key]);
            const next = `/uploads/branding/${file.filename}`;
            changes[key] = { from: branding[key], to: next };
            branding[key] = next;
        }

        if (Object.keys(changes).length > 0) {
            branding.changeLog.push({ changedBy: req.user._id, changes, changedAt: new Date() });
        }

        await branding.save();
        cache = null;
        cachedAt = 0;

        res.json({ branding });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};