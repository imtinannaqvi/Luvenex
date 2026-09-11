import EmailTemplate from '../models/EmailTemplate.js';
import { TEMPLATE_DEFS, TEMPLATE_KEYS, renderTemplate } from '../config/emailTemplates.js';


export const getTemplates = async (req, res) => {
    try {
        const saved = await EmailTemplate.find().lean();
        const byKey = Object.fromEntries(saved.map((t) => [t.key, t]));

        const templates = TEMPLATE_KEYS.map((key) => {
            const def = TEMPLATE_DEFS[key];
            const row = byKey[key];
            return {
                key,
                name: def.name,
                description: def.description,
                vars: def.vars,
                subject: row?.subject ?? def.defaultSubject,
                body: row?.body ?? def.defaultBody,
                isActive: row?.isActive ?? true,
                isCustomised: Boolean(row),
                updatedAt: row?.updatedAt ?? null,
            };
        });

        res.json({ templates });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};

export const updateTemplate = async (req, res) => {
    try {
        const { key } = req.params;
        const def = TEMPLATE_DEFS[key];
        if (!def) {
            return res.status(404).json({ error: { message: 'Unknown template' } });
        }

        const { subject, body, isActive } = req.body;

        if (subject !== undefined && !String(subject).trim()) {
            return res.status(400).json({ error: { message: 'Subject is required' } });
        }
        if (body !== undefined && !String(body).trim()) {
            return res.status(400).json({ error: { message: 'Body is required' } });
        }

        const allowed = def.vars.map((v) => v.key);
        const used = [
            ...String(subject || '').matchAll(/\{\{\s*(\w+)\s*\}\}/g),
            ...String(body || '').matchAll(/\{\{\s*(\w+)\s*\}\}/g),
        ].map((m) => m[1]);
        const unknown = [...new Set(used.filter((v) => !allowed.includes(v)))];
        if (unknown.length) {
            return res.status(400).json({
                error: {
                    message: `Unknown placeholder${unknown.length > 1 ? 's' : ''}: ${unknown
                        .map((u) => `{{${u}}}`)
                        .join(', ')}`,
                },
            });
        }

        const template = await EmailTemplate.findOneAndUpdate(
            { key },
            {
                key,
                ...(subject !== undefined && { subject: String(subject).trim() }),
                ...(body !== undefined && { body }),
                ...(isActive !== undefined && { isActive: Boolean(isActive) }),
                updatedBy: req.user._id,
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.json({ template });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};

export const resetTemplate = async (req, res) => {
    try {
        const { key } = req.params;
        if (!TEMPLATE_DEFS[key]) {
            return res.status(404).json({ error: { message: 'Unknown template' } });
        }
        await EmailTemplate.deleteOne({ key });
        res.json({ success: true, ...TEMPLATE_DEFS[key] });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};


export const sendTestEmail = async (req, res) => {
    try {
        const { key } = req.params;
        const def = TEMPLATE_DEFS[key];
        if (!def) {
            return res.status(404).json({ error: { message: 'Unknown template' } });
        }

        const sample = Object.fromEntries(def.vars.map((v) => [v.key, v.sample]));
        const row = await EmailTemplate.findOne({ key });
        const subject = renderTemplate(row?.subject ?? def.defaultSubject, sample);
        const body = renderTemplate(row?.body ?? def.defaultBody, sample);

        console.log('\n────────── TEST EMAIL ──────────');
        console.log('To:      ', req.user.email);
        console.log('Subject: ', subject);
        console.log('Body:    ', body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
        console.log('────────────────────────────────\n');

        res.json({
            message: `Test rendered for ${req.user.email}. No mail transport is configured yet, so it was written to the server log.`,
        });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};