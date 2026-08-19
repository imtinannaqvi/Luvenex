import Video from "../models/Video.js";
import InfluencerProfile from "../models/InfluencerProfile.js";
import BrandProfile from "../models/BrandProfile.js";
import fs from 'fs';
import VideoComment from "../models/VideoComment.js";

const attachHandles = async (videos) => {
  return Promise.all(
    videos.map(async (v) => {
      const videoObj = v.toObject ? v.toObject() : v;
      if (!videoObj.postedBy?._id) return videoObj;

      if (videoObj.postedByRole === 'influencer') {
        const profile = await InfluencerProfile.findOne({ userId: videoObj.postedBy._id }).select('handle');
        videoObj.postedBy.handle = profile?.handle || null;
      } else if (videoObj.postedByRole === 'brand') {
        const profile = await BrandProfile.findOne({ userId: videoObj.postedBy._id }).select('handle');
        videoObj.postedBy.handle = profile?.handle || null;
      }
      return videoObj;
    })
  );
};

export const uploadVideoPost = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'A video file is required' } });
    }

    const { caption, category,allowDownload } = req.body;
    const video = await Video.create({
      postedBy: req.user._id,
      postedByRole: req.user.role,
      caption,
      category,
      videoUrl: `/uploads/videos/${req.file.filename}`,
      allowDownload: allowDownload === 'true' || allowDownload === true,
    });

    res.status(201).json({ video });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const getVideoFeed = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.postedBy) filter.postedBy = req.query.postedBy;

    // sort logic — "trending" ranks by engagement, "latest" (default) by newest
    let sortStage = { createdAt: -1 };

    if (req.query.sort === 'trending') {
      // trending: videos from the last 7 days, ranked by likes+views combined
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filter.createdAt = { $gte: sevenDaysAgo };
    }

    let videosQuery = Video.find(filter).populate("postedBy", "name role");

    if (req.query.sort === 'trending') {
      // can't easily sort by array length in a simple .sort(), so use aggregation instead
      const videos = await Video.aggregate([
        { $match: filter },
        {
          $addFields: {
            engagementScore: {
              $add: [
                { $size: { $ifNull: ["$likes", []] } },
                { $multiply: [{ $ifNull: ["$viewCount", 0] }, 0.1] },
              ],
            },
          },
        },
        { $sort: { engagementScore: -1 } },
        { $skip: skip },
        { $limit: limit },
      ]);

      const populated = await Video.populate(videos, { path: 'postedBy', select: 'name role' });
      const videosWithHandles = await attachHandles(populated);
      const total = await Video.countDocuments(filter);

      return res.json({
        videos: videosWithHandles,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    // default: latest (newest-first)
    const [videos, total] = await Promise.all([
      videosQuery.sort(sortStage).limit(limit).skip(skip),
      Video.countDocuments(filter),
    ]);

    const videosWithHandles = await attachHandles(videos);

    res.json({
      videos: videosWithHandles,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const getVideoById = async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate('postedBy', 'name role');

    if (!video) return res.status(404).json({ error: { message: 'Video not found' } });

    const [videoWithHandle] = await attachHandles([video]);

    res.json({ video: videoWithHandle });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: { message: 'Video not found' } });

    const userId = req.user._id.toString();
    const alreadyLiked = video.likes.some(id => id.toString() === userId);

    if (alreadyLiked) {
      video.likes = video.likes.filter(id => id.toString() !== userId);
    } else {
      video.likes.push(req.user._id);
    }

    await video.save();
    res.json({
      liked: !alreadyLiked,
      likeCount: video.likes.length,
    });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const toggleSave = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: { message: 'Video not found' } });

    const userId = req.user._id.toString();
    const alreadySaved = video.savedBy.some(id => id.toString() === userId);

    if (alreadySaved) {
      video.savedBy = video.savedBy.filter(id => id.toString() !== userId);
    } else {
      video.savedBy.push(req.user._id);
    }

    await video.save();
    res.json({
      saved: !alreadySaved,
      saveCount: video.savedBy.length,
    });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const getMySavedVideos = async (req, res) => {
  try {
    const videos = await Video.find({ savedBy: req.user._id })
      .populate('postedBy', 'name role')
      .sort({ createdAt: -1 });

    const videosWithHandles = await attachHandles(videos);

    res.json({ videos: videosWithHandles });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: { message: 'Video not found' } });

    if (video.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'You can only delete your own videos' } });
    }

    const filePath = `.${video.videoUrl}`;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await video.deleteOne();
    res.json({ message: 'Video deleted' });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};


export const addComment = async (req, res) => {
  try {
    const { body, parentCommentId } = req.body;
    if (!body?.trim()) {
      return res.status(400).json({ error: { message: 'Comment body is required' } });
    }

    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: { message: 'Video not found' } });

    const comment = await VideoComment.create({
      videoId: req.params.id,
      userId: req.user._id,
      body: body.trim(),
      parentCommentId: parentCommentId || null,
    });

    // ✅ keep the video's comment count in sync
    video.commentCount = (video.commentCount || 0) + 1;
    await video.save();

    const populated = await comment.populate('userId', 'name role');
    res.status(201).json({ comment: populated, commentCount: video.commentCount });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const getComments = async (req,res) => {
  try {
    const comments = await VideoComment.find({videoId: req.params.id})
    .populate("userId",'name role')
    .sort({ createdAt: 1})

    res.json({comments})
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
}

export const updateComment = async(req,res) => {
  try {
    const comment = await VideoComment.findById(req.params.commentId);
    if(!comment) return res.status(404).json({error:{message:"comment not found"}})
      if(comment.userId.toString() !== req.user._id.toString()){
        return res.status(403).json({ error:{message:"You can only edit your comment"}})
      }
      const {body} = req.body;
      if(!body.trim()) {
        return res.status(403).json({error:{message:"comment body is required "}})
      } 
      comment.body = body.trim();
      await comment.save();
      res.json({comment})
  } catch (error) {
    return res.status(500).json({error:{message: error.message}})
  }
}

export const deleteComment = async (req, res) => {
  try {
    const comment = await VideoComment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: { message: 'Comment not found' } });

    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'You can only delete your own comments' } });
    }

    const repliesCount = await VideoComment.countDocuments({ parentCommentId: comment._id });
    await VideoComment.deleteMany({ parentCommentId: comment._id });
    await comment.deleteOne();

    // ✅ decrement by the comment itself plus any replies deleted with it
    const video = await Video.findById(comment.videoId);
    if (video) {
      video.commentCount = Math.max((video.commentCount || 0) - (1 + repliesCount), 0);
      await video.save();
    }

    res.json({ message: 'Comment deleted', commentCount: video?.commentCount ?? 0 });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};