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