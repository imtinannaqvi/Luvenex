import express from 'express';
import { getSupport, updateSupport } from "../Controllers/supportController.js";
import { protect, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Public — the floating widget on the site reads this on every page load.
router.get('/', getSupport);

// JSON body, no file upload, so no multer here.
router.patch('/', protect, requireAdmin, updateSupport);

export default router;