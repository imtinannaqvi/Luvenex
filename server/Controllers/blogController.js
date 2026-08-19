import Blog from "../models/Blog.js";
import fs from 'fs';

const deleteFile = (urlPath) => {
    if (!urlPath) return;
    const p = `.${urlPath}`;
    if (fs.existsSync(p)) fs.unlinkSync(p);
};

const slugify = (text) =>
    text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

export const createBlog = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Admin only' } });
    }

    const { title, content, author, category, tags, shortDescription, status, isFeatured, scheduledFor, seoTitle, seoDescription } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: { message: 'title and content are required' } });
    }

    let slug = slugify(title);
    const exists = await Blog.findOne({ slug });
    if (exists) slug = `${slug}-${Date.now()}`;

    const image = req.files?.image?.[0] ? `/uploads/blog/${req.files.image[0].filename}` : "";
    const secondaryImages = (req.files?.secondaryImages || []).map(f => `/uploads/blog/${f.filename}`);

    // decide the actual status based on what's requested
    let finalStatus = 'draft';
    let publishedAt;
    if (status === 'published') {
      finalStatus = 'published';
      publishedAt = new Date();
    } else if (scheduledFor && new Date(scheduledFor) > new Date()) {
      finalStatus = 'scheduled';
    }

    const blog = await Blog.create({
      title,
      slug,
      content,
      author,
      category,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      shortDescription: shortDescription || "",
      seoTitle: seoTitle || "",
      seoDescription: seoDescription || "",
      image,
      secondaryImages,
      status: finalStatus,
      publishedAt,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      scheduledFor: scheduledFor || undefined,
      createdBy: req.user._id,
    });

    res.status(201).json({ blog });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const getBlogs = async (req, res) => {
  try {
    const filter = { status: 'published' };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.tag) filter.tags = req.query.tag;
    if (req.query.featured === 'true') filter.isFeatured = true;
    if (req.query.q) filter.$text = { $search: req.query.q };

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [blogs, total] = await Promise.all([
            Blog.find(filter)
                .select('-content')
                .sort({ publishedAt: -1 })
                .skip(skip)
                .limit(limit),
            Blog.countDocuments(filter)
        ]);

        res.json({
            blogs,
            pagination: {
                page, limit, total, totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        res.status(500).json({ error: { message: error.message } })

    }
}

export const getAllBySlug = async (req, res) => {
    try {
        const blog = await Blog.findOne({ slug: req.params.slug, status: 'published' })
        if (!blog) return res.status(404).json({ error: { message: 'Blog Post Not Found' } })
        res.json({ blog })
    } catch (error) {
        res.status(500).json({ error: { message: error.message } })

    }
}

export const getAllBlogsAdmin = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(404).json({ error: { message: 'Admin Only ' } })
        }

        // NOTE: no .select('-content') here — the admin dashboard needs the full
        // content so the editor can be pre-filled when editing a post.
        const blogs = await Blog.find()
            .sort({ createdAt: -1 })
        res.json({ blogs })
    } catch (error) {
        res.status(500).json({ error: { message: error.message } })

    }
}

export const updateBlog = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Admin only' } });
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: { message: 'Blog post not found' } });

    const allowed = ['title', 'content', 'author', 'category', 'shortDescription', 'seoTitle', 'seoDescription'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) blog[key] = req.body[key];
    }
    if (req.body.tags !== undefined) {
      blog.tags = req.body.tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    if (req.body.isFeatured !== undefined) {
      blog.isFeatured = req.body.isFeatured === 'true' || req.body.isFeatured === true;
    }
    if (req.body.scheduledFor !== undefined) {
      blog.scheduledFor = req.body.scheduledFor || undefined;
    }

    if (req.body.status !== undefined) {
      if (req.body.status === 'published' && blog.status !== 'published') {
        blog.publishedAt = new Date();
      }
      blog.status = req.body.status;
    }

    if (req.files?.image?.[0]) {
      deleteFile(blog.image);
      blog.image = `/uploads/blog/${req.files.image[0].filename}`;
    }
    if (req.files?.secondaryImages?.length) {
      blog.secondaryImages.push(...req.files.secondaryImages.map(f => `/uploads/blog/${f.filename}`));
    }

    await blog.save();
    res.json({ blog });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const removeBlogImage = async (req,res) => {
    try {
        if(req.user.role !== 'admin') {
            return res.status(403).json({error:{message:'Admin only '}})
        }
        const {mediaUrl } = req.body;
        if(!mediaUrl) return res.status(400).json({error:{message:'MediaUrl is required'}})
            const blog = await Blog.findById(req.params.id)
        if(!blog) return res.status(404).json({error:{message:'Blog not Found'}})
            blog.secondaryIamges = blog.secondaryIamges.filter(u => u !== mediaUrl);
        deleteFile(mediaUrl);
        await blog.save()
        res.json({blog})
    } catch (error) {
        res.status(500).json({error:{message: error.message}})

    }
}

export const deleteBlog = async(req,res) => {
    try {
       if(req.user.role !== 'admin') {
            return res.status(403).json({error:{message:'Admin only'}})
        }
        const blog = await Blog.findById(req.params.id);
        if(!blog) return res.status(404).json({error:{message:'Blog not Found'}})
            deleteFile(blog.image);
        blog.secondaryIamges.forEach(deleteFile)
        await blog.deleteOne();
        res.json({message:'Blog Post Deleted'})
    } catch (error) {
        res.status(500).json({error:{message: error.message}})

    }
}

export const runScheduledPublishSweep = async () => {
  const now = new Date();
  const duePosts = await Blog.find({ status: 'scheduled', scheduledFor: { $lte: now } });

  for (const post of duePosts) {
    post.status = 'published';
    post.publishedAt = now;
    await post.save();
    console.log(`[SCHEDULED PUBLISH] "${post.title}" is now live`);
  }

  return duePosts.length;
};