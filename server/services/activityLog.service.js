import DealActivity from '../models/DealActivity.js';

export const logActivity = async (dealId, type, actorId, message, metadata) => {
  try {
    await DealActivity.create({ dealId, type, actorId, message, metadata });
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
};