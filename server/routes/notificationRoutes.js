import express from 'express';
import { getMyNotifications, markAsRead, markAllAsRead } from '../Controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getMyNotifications)
router.patch('/:id/read', protect, markAsRead)
router.patch('/read-all', protect, markAllAsRead)

export default router;