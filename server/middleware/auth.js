import { verifyToken } from '../lib/jwt.js';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: { message: 'No token provided' } });

    const decoded = verifyToken(token, process.env.JWT_ACCESS_SECRET);
    req.user = await User.findById(decoded.id).select('-passwordHash');
    if (!req.user) return res.status(401).json({ error: { message: 'User not found' } });

    next();
  } catch {
    res.status(401).json({ error: { message: 'Invalid or expired token' } });
  }
};


export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ error: { message: 'Forbidden' } });
  }
  next();
};

export const requireAdmin = (req,res,next) => {
  if(req.user?.role !== 'admin') {
    return res.status(403).json({error:{message:'Admin Only'}})
  }
  next();
}
/**
 * Like `protect`, but never rejects. Sets req.user when a valid token is
 * present and moves on quietly when it isn't.
 *
 * Used by GET /api/announcements/active so the route can tell whether the
 * visitor is a brand or an influencer without 401-ing logged-out visitors.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next();

    const decoded = verifyToken(token, process.env.JWT_ACCESS_SECRET);
    req.user = await User.findById(decoded.id).select('-passwordHash');

    next();
  } catch {
    // Expired or forged token just means "no audience match".
    next();
  }
};