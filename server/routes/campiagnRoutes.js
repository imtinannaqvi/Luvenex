import express from 'express';
import { updateCampaign, getCampaignById, getCampaigns, getMyCampaigns, deleteCampaign, createCampign } from '../Controllers/campignController.js';
import { protect } from '../middleware/auth.js';
import { getCampaignApplications, applyToCampaign } from '../Controllers/applicationController.js';

const router = express.Router();

// IMPORTANT: '/my' must be registered before '/:id',
// otherwise Express treats "my" as an :id param and it never reaches getMyCampaigns.
router.get('/my', protect, getMyCampaigns);

router.get('/', getCampaigns);
router.get('/:id', getCampaignById);

router.post('/', protect, createCampign);
router.patch('/:id', protect, updateCampaign);
router.delete('/:id', protect, deleteCampaign);

router.post('/:id/apply', protect, applyToCampaign);
router.get('/:id/applications', protect, getCampaignApplications);

export default router;