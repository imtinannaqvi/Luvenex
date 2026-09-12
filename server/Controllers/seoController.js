import SeoSettings from "../models/SeoSettings.js";
import Redirect from "../models/Redirect.js";
import { removeUpload } from "../middleware/upload.js";


let cache = null;
let cachedAt = 0;
const TTL = 60 * 1000;

export const getSeoSettings = async (req, res) => {
    try {
        if (cache && Date.now() - cachedAt < TTL) {
            return res.json({ seo: cache });
        }
        const settings = await SeoSettings.getSettings();
        cache = settings.toObject();
        cachedAt = Date.now();
        res.json({ seo: cache });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};

const TEXT_FIELDS = [
    'siteName', 'titleTemplate', 'defaultDescription', 'defaultKeywords',
    'canonicalBaseUrl', 'ogTitle', 'ogDescription', 'twitterHandle',
    'robotsTxt', 'googleAnalyticsId', 'googleSiteVerification',
    'bingSiteVerification', 'facebookPixelId',
];

const BOOL_FIELDS = [
    'allowIndexing', 'sitemapIncludeBlog',
    'sitemapIncludeProfiles', 'sitemapIncludeServices',
];

export const updateSeoSettings = async (req, res) => {
    try {
        const settings = await SeoSettings.getSettings();

        for (const key of TEXT_FIELDS) {
            if (req.body[key] !== undefined) settings[key] = req.body[key];
        }

        for (const key of BOOL_FIELDS) {
            if (req.body[key] !== undefined) {
                settings[key] = req.body[key] === true || req.body[key] === 'true';
            }
        }

        if (req.body.twitterCard !== undefined) {
            if (!['summary', 'summary_large_image'].includes(req.body.twitterCard)) {
                return res.status(400).json({ error: { message: 'Invalid Twitter card type' } });
            }
            settings.twitterCard = req.body.twitterCard;
        }

        if (req.body.sitemapChangeFreq !== undefined) {
            const allowed = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
            if (!allowed.includes(req.body.sitemapChangeFreq)) {
                return res.status(400).json({ error: { message: 'Invalid change frequency' } });
            }
            settings.sitemapChangeFreq = req.body.sitemapChangeFreq;
        }

        if (req.body.sitemapPriority !== undefined) {
            const p = Number(req.body.sitemapPriority);
            if (Number.isNaN(p) || p < 0 || p > 1) {
                return res.status(400).json({ error: { message: 'Priority must be between 0 and 1' } });
            }
            settings.sitemapPriority = p;
        }

        if (req.body.canonicalBaseUrl) {
            settings.canonicalBaseUrl = String(req.body.canonicalBaseUrl).replace(/\/+$/, '');
        }

        if (req.body.removeOgImage === 'true' && settings.ogImage) {
            removeUpload(settings.ogImage);
            settings.ogImage = null;
        }

        if (req.file) {
            removeUpload(settings.ogImage);
            settings.ogImage = `/uploads/seo/${req.file.filename}`;
        }

        settings.updatedBy = req.user._id;
        await settings.save();

        cache = null;
        cachedAt = 0;

        res.json({ seo: settings });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};


const normalisePath = (value) => {
    let p = String(value || '').trim();
    if (!p) return '';
    p = p.split('?')[0].split('#')[0];
    if (!p.startsWith('/') && !/^https?:\/\//i.test(p)) p = `/${p}`;
    if (p.length > 1) p = p.replace(/\/+$/, '');
    return p;
};

export const listRedirects = async (req, res) => {
    try {
        const redirects = await Redirect.find().sort({ createdAt: -1 }).lean();
        res.json({ redirects });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};

export const createRedirect = async (req, res) => {
    try {
        const from = normalisePath(req.body.from);
        const to = normalisePath(req.body.to);

        if (!from) return res.status(400).json({ error: { message: 'From path is required' } });
        if (!to) return res.status(400).json({ error: { message: 'To path is required' } });
        if (from === to) {
            return res.status(400).json({ error: { message: "A path can't redirect to itself" } });
        }

        const exists = await Redirect.findOne({ from });
        if (exists) {
            return res.status(400).json({ error: { message: `A redirect from ${from} already exists` } });
        }

        const reverse = await Redirect.findOne({ from: to, to: from, isActive: true });
        if (reverse) {
            return res.status(400).json({
                error: { message: `That would loop — ${to} already redirects back to ${from}` },
            });
        }

        const redirect = await Redirect.create({
            from,
            to,
            type: Number(req.body.type) === 302 ? 302 : 301,
            isActive: req.body.isActive !== false,
            createdBy: req.user._id,
        });

        res.status(201).json({ redirect });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};

export const updateRedirect = async (req, res) => {
    try {
        const patch = {};
        if (req.body.from !== undefined) patch.from = normalisePath(req.body.from);
        if (req.body.to !== undefined) patch.to = normalisePath(req.body.to);
        if (req.body.type !== undefined) patch.type = Number(req.body.type) === 302 ? 302 : 301;
        if (req.body.isActive !== undefined) patch.isActive = Boolean(req.body.isActive);

        if (patch.from && patch.to && patch.from === patch.to) {
            return res.status(400).json({ error: { message: "A path can't redirect to itself" } });
        }

        const redirect = await Redirect.findByIdAndUpdate(req.params.id, patch, {
            new: true,
            runValidators: true,
        });
        if (!redirect) {
            return res.status(404).json({ error: { message: 'Redirect not found' } });
        }
        res.json({ redirect });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};

export const deleteRedirect = async (req, res) => {
    try {
        const deleted = await Redirect.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: { message: 'Redirect not found' } });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};


export const resolveRedirect = async (req, res) => {
    try {
        const from = normalisePath(req.query.path);
        if (!from) return res.json({ redirect: null });

        const redirect = await Redirect.findOne({ from, isActive: true }).lean();
        if (!redirect) return res.json({ redirect: null });

        Redirect.updateOne(
            { _id: redirect._id },
            { $inc: { hits: 1 }, $set: { lastHitAt: new Date() } }
        ).catch(() => {});

        res.json({ redirect: { to: redirect.to, type: redirect.type } });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};