import express from 'express';
import {
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  activeAnnouncements,
} from "../Controllers/announcementController.js";
import { protect, requireAdmin, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// Keep /active above /:id or Express reads "active" as an id.
router.get('/active', optionalAuth, activeAnnouncements);

router.get('/', protect, requireAdmin, listAnnouncements);
router.post('/', protect, requireAdmin, createAnnouncement);
router.patch('/:id', protect, requireAdmin, updateAnnouncement);
router.delete('/:id', protect, requireAdmin, deleteAnnouncement);

export default router;