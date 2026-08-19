import Follow from '../models/Follow.js';
import User from '../models/User.js';

export const followUser = async (req, res) => {
  try {
    const targetId = req.params.userId;

    if (targetId === req.user._id.toString()) {
      return res.status(400).json({ error: { message: "You can't follow yourself" } });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) return res.status(404).json({ error: { message: 'User not found' } });

    const follow = await Follow.create({
      followerId: req.user._id,
      followingId: targetId,
    });

    res.status(201).json({ message: 'Followed successfully', follow });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: { message: 'You are already following this user' } });
    }
    res.status(500).json({ error: { message: err.message } });
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const targetId = req.params.userId;

    const result = await Follow.findOneAndDelete({
      followerId: req.user._id,
      followingId: targetId,
    });

    if (!result) {
      return res.status(404).json({ error: { message: 'You are not following this user' } });
    }

    res.json({ message: 'Unfollowed successfully' });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const getFollowers = async (req, res) => {
  try {
    const follows = await Follow.find({ followingId: req.params.userId })
      .populate('followerId', 'name role')
      .sort({ createdAt: -1 });

    res.json({ followers: follows.map((f) => f.followerId) });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const follows = await Follow.find({ followerId: req.params.userId })
      .populate('followingId', 'name role')
      .sort({ createdAt: -1 });

    res.json({ following: follows.map((f) => f.followingId) });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const getFollowStatus = async (req, res) => {
  try {
    const targetId = req.params.userId;

    const [isFollowing, followerCount, followingCount] = await Promise.all([
      Follow.exists({ followerId: req.user._id, followingId: targetId }),
      Follow.countDocuments({ followingId: targetId }),
      Follow.countDocuments({ followerId: targetId }),
    ]);

    res.json({
      isFollowing: Boolean(isFollowing),
      followerCount,
      followingCount,
    });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};