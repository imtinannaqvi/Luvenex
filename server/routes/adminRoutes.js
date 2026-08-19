import express from 'express';
import { getDashboardStats, getUsers, getAllDeals,getPayOutQueue,  adminReleaseEscrow, getAdminTimeline ,getKycQueue,getLedger,getUserDetail, getUserStatus, getReferralOverview, getVerificationQueue, reviewVerification, getPendingReviews,modrateReviews  } from '../Controllers/adminController.js';
import { protect, requireAdmin } from '../middleware/auth.js';


const router = express.Router();
router.use(protect,requireAdmin)

router.get('/stats',  getDashboardStats)
router.get('/users', getUsers)
router.get('/stats/timeline', getAdminTimeline);
router.get('/users/:id', getUserDetail)
router.post('/users/:id/status', getUserStatus)
router.get('/deals', getAllDeals)
router.get('/ledger', getLedger)
router.get('/kyc-queue', getKycQueue)
router.get('/payout-queue', getPayOutQueue)
router.post('/deals/:id/release', adminReleaseEscrow);
router.get('/referrals', getReferralOverview);
router.get('/verification-queue', getVerificationQueue)
router.post('/verification/:userId/review', reviewVerification)
router.get('/reviews/pending', getPendingReviews);
router.post('/reviews/:id/moderate', modrateReviews);


export default router;