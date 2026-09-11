import express from 'express';
import { getBranding, updateBranding } from "../Controllers/brandingController.js";
import { protect, requireAdmin } from "../middleware/auth.js";
import { uploadBranding } from "../middleware/upload.js";

const router = express.Router();

router.get('/', getBranding); // public — the site header reads this
router.patch('/', protect, requireAdmin, uploadBranding, updateBranding);

export default router;