import EmailTemplate from '../models/EmailTemplate.js';
import Branding from '../models/Branding.js';
import { TEMPLATE_DEFS, renderTemplate } from '../config/emailTemplates.js';
import { wrapEmail, styleBodyHtml } from '../config/emailLayout.js';

let logoCache = null;
let logoCachedAt = 0;
const LOGO_TTL = 5 * 60 * 1000;

export const getLogoUrl = async () => {
  if (logoCache !== null && Date.now() - logoCachedAt < LOGO_TTL) return logoCache;
  try {
    const branding = await Branding.findOne().lean();
    const base = process.env.API_PUBLIC_URL || process.env.CLIENT_URL || '';
    logoCache = branding?.logo ? `${base}${branding.logo}` : '';
  } catch {
    logoCache = '';
  }
  logoCachedAt = Date.now();
  return logoCache;
};


export const deliver = async ({ to, subject, html }) => {
  console.log('\n────────── EMAIL ──────────');
  console.log('To:      ', to);
  console.log('Subject: ', subject);
  console.log('Body:    ', html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  console.log('───────────────────────────\n');
  return { queued: true };
};


export const sendTemplate = async (key, to, data = {}) => {
  try {
    if (!to) return;
    if (!TEMPLATE_DEFS[key]) {
      console.warn(`[email] unknown template key: ${key}`);
      return;
    }

    let template = await EmailTemplate.findOne({ key });

    // Fall back to the defaults if an admin has never saved this one.
    if (!template) {
      const def = TEMPLATE_DEFS[key];
      template = { subject: def.defaultSubject, body: def.defaultBody, isActive: true };
    }

    if (!template.isActive) return;

    const logoUrl = await getLogoUrl();
    const inner = styleBodyHtml(renderTemplate(template.body, data));

    await deliver({
      to,
      subject: renderTemplate(template.subject, data),
      html: wrapEmail({ body: inner, logoUrl }),
    });
  } catch (err) {
    console.error(`[email] failed to send "${key}":`, err.message);
  }
};