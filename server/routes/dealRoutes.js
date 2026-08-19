import {
  requestRevision,
  deliverDeal,
  cancelDeal,
  getDealActivity,
  completeDeal,
  getDealsTimeline,
  createDeal,
  getDealById,
  getDeals,
  startDeal,
  acceptDeal,
  approveDeal,
  fundDeal,
  requestCancellation,
  respondToCancellation,
  getWorkHistory
} from "../Controllers/dealController.js";
import { protect } from "../middleware/auth.js";
import { createReview, getMyReviewStatus } from "../Controllers/reviewController.js";
import { fileComplaint } from "../Controllers/complaintController.js";
import { uploadDelivery } from '../middleware/upload.js';
import { notify } from "../services/notification.service.js";

import express from 'express';

const router = express.Router();

router.post('/', protect, createDeal);
router.get('/', protect, getDeals);
router.get('/stats/timeline', protect, getDealsTimeline);
router.get('/work-history/:handle', getWorkHistory);

router.get('/:id', protect, getDealById);
router.get('/:id/activity', protect, getDealActivity);
router.get('/:id/my-review-status', protect, getMyReviewStatus);

router.post('/:id/accept', protect, acceptDeal);
router.post('/:id/fund', protect, fundDeal);
router.post('/:id/start', protect, startDeal);
router.post('/:id/deliver', protect, uploadDelivery.array('files', 5), deliverDeal);
router.post('/:id/approve', protect, approveDeal);
router.post('/:id/request-revision', protect, requestRevision);
router.post('/:id/cancel', protect, cancelDeal);
router.post('/:id/complete', protect, completeDeal);
router.post('/:id/review', protect, createReview);
router.post('/:id/complaint', protect, fileComplaint);
router.post('/:id/request-cancellation', protect, requestCancellation);
router.post('/:id/respond-cancellation', protect, respondToCancellation);

export default router;