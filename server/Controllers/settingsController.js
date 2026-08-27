import PlatformSettings from "../models/PlatformSettings.js";

export const getPlatformSettings = async (req, res) => {
    try {
        const settings = await PlatformSettings.getSettings();
        res.json({ settings })
    } catch (error) {
        res.status(500).json({ error: { message: error.message } })

    }
}


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
            'inactiveAccountAutoSuspendDays','minDealsForVerification',
        ];

        const changes = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined && req.body[key] !== settings[key]) {
                changes[key] = { from: settings[key], to: req.body[key] };
                settings[key] = req.body[key];
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


export const getPublicSettings = async(req,res) => {
    try {
        const settings = await PlatformSettings.getSettings();
        res.json({
            maintenanceMode:settings.maintenanceMode,
            maintenanceMessage: settings.maintenanceMessage,
            announcementEnabled: settings.accouncementEnabled,
            announcementMessage: settings.accounceMessage
        })

    } catch (error) {
        res.status(500).json({error:{message: error.message}})
        
    }
}