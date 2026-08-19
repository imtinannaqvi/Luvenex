import { requestVerification } from "../Controllers/verificationController.js";
import { protect } from "../middleware/auth.js";
import express from 'express';

const router = express.Router();

router.post('/request', protect, requestVerification);

export default router;