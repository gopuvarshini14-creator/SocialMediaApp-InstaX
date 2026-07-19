const express = require('express');
const router = express.Router();
const { getUnreadCount, getConversations, getMessages, sendMessage, getConnectedUsers } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

// Message routes
router.get('/unread-count', protect, getUnreadCount);
router.get('/conversations', protect, getConversations);
router.get('/connected-users', protect, getConnectedUsers);
router.get('/:userId', protect, getMessages);
router.post('/', protect, sendMessage);

module.exports = router;
