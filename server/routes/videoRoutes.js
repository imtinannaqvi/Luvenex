import express from 'express';
import { getVideoById, deleteVideo, uploadVideoPost, getMySavedVideos, getVideoFeed, toggleSave, toggleLike, addComment,updateComment,getComments,deleteComment } from '../Controllers/videoController.js';

import { protect } from '../middleware/auth.js';
import { uploadVideo } from '../middleware/upload.js';

const router = express.Router();

router.get("/", getVideoFeed);

router.get("/saved/me", protect, getMySavedVideos);

router.get("/:id", getVideoById);

router.post("/", protect, uploadVideo.single("video"), uploadVideoPost);

router.post("/:id/like", protect, toggleLike);

router.post("/:id/save", protect, toggleSave);

router.delete("/:id", protect, deleteVideo);

router.get('/:id/comments', getComments);
router.post('/:id/comments', protect, addComment);
router.patch('/comments/:commentId', protect, updateComment);
router.delete('/comments/:commentId', protect, deleteComment);

export default router;