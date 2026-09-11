import { sendTestEmail,resetTemplate,getTemplates,updateTemplate } from "../Controllers/emailTemplateController.js";
import { requireAdmin,protect } from "../middleware/auth.js";
import express from "express"

const router = express.Router()

router.get('/', protect, requireAdmin, getTemplates)
router.patch('/:key', protect, requireAdmin, updateTemplate)
router.post('/:key/reset', protect, requireAdmin, resetTemplate)
router.post('/:key/test', protect,requireAdmin, sendTestEmail)

export default router;