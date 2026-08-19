import { getPlatformSettings,getPublicSettings,updatePlatformSettings } from "../Controllers/settingsController.js";
import express from 'express';
import { protect, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get('/public', getPublicSettings)
router.get('/', protect, requireAdmin, getPlatformSettings)
router.patch('/', protect, requireAdmin, updatePlatformSettings)

export default router;