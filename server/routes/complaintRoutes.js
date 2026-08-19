import express from 'express';
import { reviewComplaint,getComplaints,getComplaintsAgainstUser,fileComplaint } from '../Controllers/complaintController.js';
import { protect, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(protect, requireAdmin)
router.get('/', getComplaints)
router.get('/against/:userId', getComplaintsAgainstUser)
router.post('/:id.review', reviewComplaint)

export default router;