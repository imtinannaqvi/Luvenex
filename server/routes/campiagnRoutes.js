import express from 'express';
import { updateCampaign, getCampaignById, getCampaigns, deleteCampaign, createCampign } from '../Controllers/campignController.js';
import { protect } from '../middleware/auth.js';
import { getCampaignApplications,applyToCampaign } from '../Controllers/applicationController.js';

const router = express.Router();

router.get('/', getCampaigns);        // ← fixed: comma not period
router.get('/:id', getCampaignById);

router.post('/', protect, createCampign);
router.patch('/:id', protect, updateCampaign);
router.delete('/:id', protect, deleteCampaign);

router.post('/:id/apply', protect, applyToCampaign);            
router.get('/:id/applications', protect, getCampaignApplications);

export default router;