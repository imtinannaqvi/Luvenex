import express from 'express';
import { depositTest, getWallet } from '../controllers/dealController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getWallet);
router.post('/deposit', protect, depositTest);

export default router;