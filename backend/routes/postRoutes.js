const express = require('express');
const router = express.Router();
const { createPost, getFeed, getExplorePosts, getUserPosts, likePost, unlikePost, addComment, getComments, deletePost } = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.post('/', protect, upload.single('media'), createPost);
router.get('/', protect, getFeed);
router.get('/explore', protect, getExplorePosts);
router.get('/user/:userId', protect, getUserPosts);

// Like routes
router.post('/:postId/like', protect, likePost);
router.delete('/:postId/like', protect, unlikePost);

// Comment routes
router.post('/:postId/comments', protect, addComment);
router.get('/:postId/comments', protect, getComments);

// Delete post route
router.delete('/:postId', protect, deletePost);

module.exports = router;

