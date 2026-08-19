const PHONE_REGEX = /(\+?\d[\d\s\-\(\)]{7,}\d)/g;
const WHATSAPP_REGEX = /\b(whats\s?app|wa\.me|whatsapp)\b/i;
const SOCIAL_REGEX = /\b(instagram|insta|ig|telegram|snapchat|@[a-zA-Z0-9_.]{3,})\b/i;
const OFF_PLATFORM_PHRASES = /\b(call me|text me|contact me (on|at)|reach me (on|at)|my number is|off[\s-]?platform|outside (the )?app)\b/i;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export const scanMessage = (text) => {
  const reasons = [];

  if (PHONE_REGEX.test(text)) reasons.push('possible phone number');
  if (WHATSAPP_REGEX.test(text)) reasons.push('mentions WhatsApp');
  if (SOCIAL_REGEX.test(text)) reasons.push('mentions social handle/platform');
  if (OFF_PLATFORM_PHRASES.test(text)) reasons.push('suggests contact off-platform');
  if (EMAIL_REGEX.test(text)) reasons.push('possible email address');

  return {
    flagged: reasons.length > 0,
    reasons,
  };
};