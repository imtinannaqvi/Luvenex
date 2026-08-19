import express, { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { uploadKyc } from '../middleware/upload.js';
import { getMyKyc,reviewKyc,rejectPayout,requestPayout,completePayout,submitKyc, getmyPayouts } from '../Controllers/payoutController.js';

const router = express.Router();

router.get('/kyc/me',protect,getMyKyc)
router.post('/kyc/submit', protect, uploadKyc.fields([{ name: 'cnicFront', maxCount: 1 }, { name: 'cnicBack', maxCount: 1 }]), submitKyc)
router.post('/kyc/:userId/review', protect, reviewKyc)
router.post('/payouts', protect,requestPayout)
router.get('/payouts', protect, getmyPayouts)
router.post('/payouts/:id/complete', protect, completePayout)
router.post('/payouts/:id/reject', protect, rejectPayout)

export default router;
