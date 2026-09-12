import express from 'express';
import { getSeoSettings,updateRedirect,updateSeoSettings,resolveRedirect,deleteRedirect,createRedirect,listRedirects } from '../Controllers/seoController.js';
import { protect, requireAdmin } from '../middleware/auth.js';
import { uploadSeoImage } from '../middleware/upload.js';

const router = express.Router()

router.get('/', getSeoSettings)
router.patch('/', protect, requireAdmin,uploadSeoImage.single('ogImage'), updateSeoSettings)

router.get('/redirects/resolve', resolveRedirect)
router.get('/redirects', protect, requireAdmin,listRedirects)
router.post('/redirects', protect,requireAdmin,createRedirect)
router.patch('/redirects/:id', protect, requireAdmin,updateRedirect)
router.delete('/redirects/:id', protect, requireAdmin,deleteRedirect)


export default router;


