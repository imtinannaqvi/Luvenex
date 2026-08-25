import crypto from 'crypto';
export const generateReferralCode = (name) => {
    const namePart = name.replace(/[^a-zA-Z]/g,'').slice(0,5).toUpperCase();
    const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${namePart}${randomPart}`;
};

export const generateHandle = (name) => {
    const base = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    const suffix = crypto.randomBytes(2).toString('hex');
    return `${base}-${suffix}`;
};
