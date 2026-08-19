import { deleteGig, createGig, getGigById, getGigs, updateGig } from "../Controllers/gigController.js";
import express from 'express';
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get('/', getGigs);
router.get('/:id', getGigById);
router.post('/', protect, createGig);
router.patch('/:id', protect, updateGig);
router.delete('/:id', protect, deleteGig);   // ✅ delete, not patch

export default router;