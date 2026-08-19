import Notification from "../models/Notification.js";

export const notify = async (userId, type, title, message, relatedId) => {
  try {
    await Notification.create({ userId, type, title, message, relatedId });
  } catch (error) {
    console.error('Notification Error:', error.message);
  }
};