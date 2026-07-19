const express = require('express');
const router = express.Router();
const { followUser, unfollowUser, getFollowStats, searchUsers } = require('../controllers/followController');
const { protect } = require('../middleware/authMiddleware');

// Search users
router.get('/search', protect, searchUsers);

// Follow/unfollow routes
router.post('/:userId/follow', protect, followUser);
router.delete('/:userId/follow', protect, unfollowUser);
router.get('/:userId/stats', protect, getFollowStats);

module.exports = router;
