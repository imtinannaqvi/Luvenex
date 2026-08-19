import express from 'express';
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowStatus,
} from '../Controllers/followController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/:userId', protect, followUser);
router.delete('/:userId', protect, unfollowUser);
router.get('/:userId/followers', getFollowers);   
router.get('/:userId/following', getFollowing);   
router.get('/:userId/status', protect, getFollowStatus);   

export default router;