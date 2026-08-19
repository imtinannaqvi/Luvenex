import { closeServiceRequest, cancleServiceRequest,getAllServiceRequest,getMyServiceRequests,createServiceResquest,matchServiceRequest } from "../Controllers/serviceRequestController.js";
import { protect } from "../middleware/auth.js";
import express from 'express';

const router = express.Router();

router.post('/',protect,createServiceResquest)
router.get('/me', protect, getMyServiceRequests)
router.get('/', protect, getAllServiceRequest)
router.post('/:id/match', protect, matchServiceRequest)
router.post('/:id/cancel', protect, cancleServiceRequest)
router.post('/:id/close', protect, closeServiceRequest)

export default router;
