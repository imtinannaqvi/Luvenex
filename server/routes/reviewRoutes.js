import { protect } from "../middleware/auth.js";
import express from 'express';
import { getUserReviews } from "../Controllers/reviewController.js";   // ← plural

const router = express.Router();

router.get('/users/:id/reviews', getUserReviews);   // ← plural in both the path and the handler

export default router;