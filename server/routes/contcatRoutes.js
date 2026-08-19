import express from 'express';
import { getContactMessages,updateContactMessageStatus,submitContactMessage } from '../Controllers/contactController.js';
const router = express.Router();

import {verifyToken} from '../lib/jwt.js';
import User from "../models/User.js";
import { protect } from '../middleware/auth.js';


const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (token) {
      const decoded = verifyToken(token, process.env.JWT_ACCESS_SECRET);
      req.user = await User.findById(decoded.id).select('-passwordHash');
    }
  } catch {
  }
  next();
};

router.post('/', optionalAuth, submitContactMessage)
router.get('/', protect, getContactMessages)
router.post('/:id', protect, updateContactMessageStatus)

export default router;