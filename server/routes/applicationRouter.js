import express from 'express';
import { acceptApplication,rejectApplication,getMyApplications,updateApplication } from '../Controllers/applicationController.js';
import { protect } from '../middleware/auth.js';
const router = express.Router();

router.get('/me', protect, getMyApplications);
router.post('/:id/accept', protect, acceptApplication);
router.post('/:id/reject', protect, rejectApplication);
router.patch('/:id', protect, updateApplication);

export default router;

