import { protect } from "../middleware/auth.js";
import express from 'express';
import { uploadServiceMedia } from "../middleware/upload.js";
import { createService, getServiceById, getServices, updateService, removeServiceMedia, deleteService } from "../Controllers/serviceController.js";

const router = express.Router();
const serviceUploads = uploadServiceMedia.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'gallery', maxCount: 8 },
  { name: 'videos', maxCount: 3 },
  { name: 'icon', maxCount: 1 },   
]);

router.get('/', getServices)
router.get('/:id', getServiceById)
router.post('/', protect, serviceUploads, createService)
router.patch('/:id', protect, serviceUploads, updateService)
router.post('/:id/media', protect, removeServiceMedia)
router.delete('/:id', protect, deleteService)

export default router;