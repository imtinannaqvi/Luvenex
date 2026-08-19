import { updateBlog,getAllBlogsAdmin,getBlogs,getAllBySlug,createBlog,deleteBlog,removeBlogImage } from "../Controllers/blogController.js";
import express from 'express';
import { protect } from "../middleware/auth.js";
import { uploadBlogMedia } from "../middleware/upload.js";

const router = express.Router();

const blogUploads = uploadBlogMedia.fields([
  { name: 'image', maxCount: 1 },           
  { name: 'secondaryImages', maxCount: 10 }, 
]);
router.get('/admin/all', protect,getAllBlogsAdmin )
router.post('/',protect,blogUploads, createBlog)
router.patch('/:id', protect, blogUploads, updateBlog)
router.delete('/:id/media', protect, removeBlogImage)
router.delete('/:id', protect, deleteBlog)
router.get('/', getBlogs)
router.get('/:slug', getAllBySlug )

export default router;