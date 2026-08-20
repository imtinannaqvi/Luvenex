import { deleteGig, createGig, getGigById, getGigs, getMyGigs, updateGig } from "../Controllers/gigController.js";
import express from 'express';
import { protect } from "../middleware/auth.js";

const router = express.Router();

// IMPORTANT: '/my' must be registered before '/:id',
// otherwise Express treats "my" as an :id param and it never reaches getMyGigs.
router.get('/my', protect, getMyGigs);

router.get('/', getGigs);
router.get('/:id', getGigById);
router.post('/', protect, createGig);
router.patch('/:id', protect, updateGig);
router.delete('/:id', protect, deleteGig);   // ✅ delete, not patch

export default router;