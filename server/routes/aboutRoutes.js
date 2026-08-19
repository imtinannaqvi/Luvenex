import express from "express";
import { getAboutPage,updateAboutPage } from "../Controllers/aboutController.js";
import { protect } from "../middleware/auth.js";
import { uploadAboutImage } from "../middleware/upload.js";

const router = express.Router();
router.get('/', getAboutPage)
router.patch('/', protect,uploadAboutImage.single('heroImage'), updateAboutPage);

export default router;