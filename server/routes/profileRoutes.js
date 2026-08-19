import {
  updateBrandMe,
  updateInfluencerMe,
  searchInfluencers,
  getBrandByHandle,
  getInfluencerByHandle,
  addPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  updateAvatar,
  getMyBrandProfile,
  getMyInfluencerProfile,
  uploadCover as uploadCoverController
} from "../Controllers/profileController.js";
import { protect } from "../middleware/auth.js";
import { uploadMedia, uploadAvatar, uploadCover } from "../middleware/upload.js";
import express from 'express';

const router = express.Router();

// influencers — specific routes before /:handle
router.get('/influencers', searchInfluencers);
router.get('/influencers/me', protect, getMyInfluencerProfile);
router.patch('/influencers/me', protect, updateInfluencerMe);
router.post('/influencers/cover', protect, uploadCover.single('cover'), uploadCoverController);
router.get('/influencers/:handle', getInfluencerByHandle);

// brands — specific routes before /:handle
router.patch('/brands/me', protect, updateBrandMe);
router.get('/brands/me', protect, getMyBrandProfile);
router.post('/brands/cover', protect, uploadCover.single('cover'), uploadCoverController);
router.get('/brands/:handle', getBrandByHandle);

// portfolio — now URL-based (JSON body), no file middleware
router.post(
  '/portfolio',
  protect,
  uploadMedia.single('media'),
  addPortfolioItem
);
router.patch('/portfolio/:itemId', protect, uploadMedia.single('media'), updatePortfolioItem);
router.delete('/portfolio/:itemId', protect, deletePortfolioItem);

// avatar
router.post('/profile/avatar', protect, uploadAvatar.single('avatar'), updateAvatar);

export default router;