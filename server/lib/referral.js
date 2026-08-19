import crypto from 'crypto';
export const generateReferralCode = (name) => {
    const namePart = name.replace(/[^a-zA-Z]/g,'').slice(0,5).toUpperCase();
    const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${namePart}${randomPart}`;
};