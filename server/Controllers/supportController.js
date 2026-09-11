import Support from "../models/Support.js";

const POSITIONS = ['bottom-right', 'bottom-left'];
const ICONS = ['headset', 'chat-bubble', 'whatsapp'];
const HEX = /^#[0-9a-fA-F]{6}$/;

export const getSupport = async (req, res) => {
    try {
        const support = await Support.getSupport();
        res.json({ support });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};

export const updateSupport = async (req, res) => {
    try {
        const support = await Support.getSupport();
        const b = req.body;

        if (b.whatsappNumber !== undefined) {
            const digits = String(b.whatsappNumber).replace(/\D/g, '');
            // Enabled widget with no number would render a dead button, so the
            // number is only required when the widget is actually on.
            const enabled = b.isEnabled !== undefined ? b.isEnabled : support.isEnabled;
            if (enabled && digits.length === 0) {
                return res.status(400).json({
                    error: { message: 'Add a WhatsApp number, or turn the widget off' },
                });
            }
            if (digits.length > 0 && (digits.length < 8 || digits.length > 15)) {
                return res.status(400).json({
                    error: { message: 'WhatsApp number must be 8 to 15 digits including the country code' },
                });
            }
            support.whatsappNumber = digits;
        }

        if (b.primaryColor !== undefined) {
            if (!HEX.test(b.primaryColor)) {
                return res.status(400).json({
                    error: { message: 'Primary color must be a hex value like #25D366' },
                });
            }
            support.primaryColor = b.primaryColor;
        }

        if (b.widgetPosition !== undefined) {
            if (!POSITIONS.includes(b.widgetPosition)) {
                return res.status(400).json({ error: { message: 'Invalid widget position' } });
            }
            support.widgetPosition = b.widgetPosition;
        }

        if (b.buttonIcon !== undefined) {
            if (!ICONS.includes(b.buttonIcon)) {
                return res.status(400).json({ error: { message: 'Invalid button icon' } });
            }
            support.buttonIcon = b.buttonIcon;
        }

        for (const key of ['headerTitle', 'headerSubtitle', 'greetingMessage']) {
            if (b[key] !== undefined) support[key] = b[key];
        }

        if (b.isEnabled !== undefined) support.isEnabled = Boolean(b.isEnabled);

        support.updatedBy = req.user._id;
        await support.save();

        res.json({ support });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};