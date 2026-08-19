import express from 'express';
import { login,verifyOtp,forgotPassword,resetPassword,signUp, deactivateAccount,getMyReferralInfo ,getMe,refresh,updatePrivacySettings, } from '../Controllers/authController.js';
import { protect } from '../middleware/auth.js';
const router = express.Router();

router.post('/signup', signUp)
router.post('/login', login)
router.post('/verify-otp', verifyOtp)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.get('/me', protect, getMe )
router.post('/refresh', refresh)
router.post('/deactivate', protect, deactivateAccount);
router.post('/privacy', protect,updatePrivacySettings)
router.get('/referrals/me', protect, getMyReferralInfo);

export default router;

