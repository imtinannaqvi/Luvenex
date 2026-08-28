import { deleteGig, createGig, getGigById, getGigs, getMyGigs, updateGig, orderGig } from "../Controllers/gigController.js";
import express from 'express';
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get('/my', protect, getMyGigs);

router.get('/', getGigs);
router.get('/:id', getGigById);
router.post("/:id/order", protect,orderGig)
router.post('/', protect, createGig);
router.patch('/:id', protect, updateGig);
router.delete('/:id', protect, deleteGig);   

export default router;