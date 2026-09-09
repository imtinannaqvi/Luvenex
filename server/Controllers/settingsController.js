import PlatformSettings from "../models/PlatformSettings.js";

export const getPlatformSettings = async (req, res) => {
    try {
        const settings = await PlatformSettings.getSettings();
        res.json({ settings })
    } catch (error) {
        res.status(500).json({ error: { message: error.message } })

    }
}

/**
 * Rejects a merged settings object that doesn't make sense.
 * Validate the MERGE, not the incoming body — the admin UI now sends partial
 * updates, so a request carrying only brandFeePercent can still push the
 * combined commission over 100%.
 */
const validateSettings = (s) => {
    const brand = Number(s.brandFeePercent ?? 0);
    const infl = Number(s.influencerFeePercent ?? 0);
    if (brand < 0 || infl < 0) return "Fees can't be negative";
    if (brand + infl > 100) return "Brand and influencer fees can't add up to more than 100%";

    const referral = Number(s.referralRewardPercent ?? 0);
    if (referral < 0 || referral > 100) return "Referral reward must be between 0 and 100%";

    const min = Number(s.minDealPriceMinor ?? 0);
    const max = Number(s.maxDealPriceMinor ?? 0);
    if (min < 0 || max < 0) return "Deal prices can't be negative";
    if (max > 0 && min > max) return "Minimum deal price can't be above the maximum";

    if (Number(s.minWithdrawalMinor ?? 0) < 0) return "Minimum withdrawal can't be negative";
    if (Number(s.autoReleaseDays ?? 0) < 0) return "Auto-release days can't be negative";

    const modRating = Number(s.reviewModerationMinRating ?? 2);
    if (modRating < 1 || modRating > 5) return "Review moderation rating must be between 1 and 5";

    const lowThreshold = Number(s.lowRatingThreshold ?? 2.5);
    if (lowThreshold < 1 || lowThreshold > 5) return "Rating threshold must be between 1 and 5";

    const single = Number(s.singleReviewFlagRating ?? 2);
    if (single < 1 || single > 5) return "Single review flag rating must be between 1 and 5";

    if (s.maintenanceStartAt && s.maintenanceEndAt) {
        if (new Date(s.maintenanceEndAt) <= new Date(s.maintenanceStartAt)) {
            return "Maintenance end time must be after the start time";
        }
    }

    return null;
};

export const updatePlatformSettings = async (req, res) => {
    try {
        const settings = await PlatformSettings.getSettings();
        const allowed = [
            'brandFeePercent', 'influencerFeePercent', 'referralRewardPercent',
            'minWithdrawalMinor', 'autoReleaseDays', 'minDealPriceMinor',
            'maxDealPriceMinor', 'kycRequired', 'maintenanceMode',
            'maintenanceMessage', 'complaintAutoFlagThreshold',
            'announcementEnabled', 'announcementMessage',
            'reviewModerationEnabled', 'reviewModerationMinRating',
            'inactiveAccountAutoSuspendDays', 'minDealsForVerification',
            // ── ADDED — these were being sent by the admin UI but silently dropped ──
            'maintenanceStartAt', 'maintenanceEndAt',
            'deactivationReasonRequired',
            'lowRatingFlagEnabled', 'lowRatingThreshold', 'singleReviewFlagRating',
        ];

        // Build the proposed state first so it can be validated before anything
        // is written to the document.
        const proposed = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) {
                // Empty datetime-local inputs arrive as "" — store null so the
                // Date cast doesn't throw and the "is it scheduled" checks work.
                proposed[key] = req.body[key] === "" ? null : req.body[key];
            }
        }

        const invalid = validateSettings({ ...settings.toObject(), ...proposed });
        if (invalid) return res.status(400).json({ error: { message: invalid } });

        const changes = {};
        for (const [key, value] of Object.entries(proposed)) {
            if (String(settings[key]) !== String(value)) {
                changes[key] = { from: settings[key], to: value };
                settings[key] = value;
            }
        }

        if (Object.keys(changes).length > 0) {
            settings.changeLog.push({ changedBy: req.user._id, changes, changedAt: new Date() });
        }

        await settings.save();
        res.json({ settings });

    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};

export const getPublicSettings = async (req, res) => {
    try {
        const settings = await PlatformSettings.getSettings();
        res.json({
            maintenanceMode: settings.maintenanceMode,
            maintenanceMessage: settings.maintenanceMessage,
            maintenanceStartAt: settings.maintenanceStartAt,
            maintenanceEndAt: settings.maintenanceEndAt,
            referralRewardPercent: settings.referralRewardPercent,

            // DEPRECATED: kept so existing consumers don't break mid-migration.
            // Once the frontend reads GET /api/announcements/active instead,
            // delete these two lines and the schema fields behind them.
            announcementEnabled: settings.announcementEnabled,
            announcementMessage: settings.announcementMessage,
        })

    } catch (error) {
        res.status(500).json({ error: { message: error.message } })

    }
}