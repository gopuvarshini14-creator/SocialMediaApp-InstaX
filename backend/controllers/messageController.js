const { query } = require('../config/db');
const cacheService = require('../services/cacheService');
const { queueService } = require('../services/queueService');

const getUnreadCount = async (req, res) => {
    try {
        const result = await query(
            'SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND is_read = false',
            [req.user.id]
        );

        res.json({ unreadCount: parseInt(result.rows[0].count) });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getConversations = async (req, res) => {
    try {
        // Get all conversations where user is either sender or receiver
        const result = await query(
            `SELECT DISTINCT ON (conversation_id)
                m.id,
                m.sender_id,
                m.receiver_id,
                m.content,
                m.created_at,
                m.is_read,
                CASE 
                    WHEN m.sender_id = $1 THEN m.receiver_id
                    ELSE m.sender_id
                END as other_user_id,
                u.username,
                u.avatar_url
            FROM messages m
            JOIN users u ON u.id = CASE 
                WHEN m.sender_id = $1 THEN m.receiver_id
                ELSE m.sender_id
            END
            WHERE m.sender_id = $1 OR m.receiver_id = $1
            ORDER BY conversation_id, m.created_at DESC`,
            [req.user.id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getMessages = async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await query(
            `SELECT m.*, 
                    sender.username as sender_username,
                    sender.avatar_url as sender_avatar,
                    receiver.username as receiver_username,
                    receiver.avatar_url as receiver_avatar
             FROM messages m
             JOIN users sender ON m.sender_id = sender.id
             JOIN users receiver ON m.receiver_id = receiver.id
             WHERE (m.sender_id = $1 AND m.receiver_id = $2)
                OR (m.sender_id = $2 AND m.receiver_id = $1)
             ORDER BY m.created_at ASC`,
            [req.user.id, userId]
        );

        // Mark messages as read
        await query(
            'UPDATE messages SET is_read = true WHERE receiver_id = $1 AND sender_id = $2',
            [req.user.id, userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const sendMessage = async (req, res) => {
    const { receiverId, content } = req.body;

    try {
        // Check if users are connected (at least one follows the other)
        const connection = await query(
            `SELECT * FROM follows 
             WHERE (follower_id = $1 AND following_id = $2)
                OR (follower_id = $2 AND following_id = $1)`,
            [req.user.id, receiverId]
        );

        if (connection.rows.length === 0) {
            return res.status(403).json({ message: 'You must be connected to send messages' });
        }

        // Create conversation_id (smaller id first for consistency)
        const conversationId = req.user.id < receiverId
            ? `${req.user.id}_${receiverId}`
            : `${receiverId}_${req.user.id}`;

        const result = await query(
            `INSERT INTO messages (sender_id, receiver_id, content, conversation_id)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [req.user.id, receiverId, content, conversationId]
        );

        const message = result.rows[0];

        // Get sender info for real-time notification
        const senderInfo = await query(
            'SELECT username, avatar_url FROM users WHERE id = $1',
            [req.user.id]
        );

        // Add notification job to queue
        await queueService.addMessageNotification({
            receiverId,
            senderId: req.user.id,
            senderUsername: senderInfo.rows[0].username,
            messageContent: content
        });

        // Send real-time message
        const realtimeService = req.app.get('realtimeService');
        if (realtimeService) {
            await realtimeService.sendMessage(receiverId, {
                ...message,
                sender_username: senderInfo.rows[0].username,
                sender_avatar: senderInfo.rows[0].avatar_url
            });

            // Send real-time notification
            await realtimeService.sendMessageNotification(
                receiverId,
                {
                    id: req.user.id,
                    username: senderInfo.rows[0].username,
                    avatar_url: senderInfo.rows[0].avatar_url
                },
                content
            );
        }

        res.status(201).json(message);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


const getConnectedUsers = async (req, res) => {
    try {
        // Get users who are mutually following (connected) with unread message count
        const result = await query(
            `SELECT DISTINCT u.id, u.username, u.avatar_url, u.full_name,
                (SELECT COUNT(*)::int 
                 FROM messages m 
                 WHERE m.sender_id = u.id 
                 AND m.receiver_id = $1 
                 AND m.is_read = false) as unread_count
             FROM users u
             WHERE u.id IN (
                 SELECT f1.following_id
                 FROM follows f1
                 JOIN follows f2 ON f1.following_id = f2.follower_id 
                    AND f1.follower_id = f2.following_id
                 WHERE f1.follower_id = $1
             )
             ORDER BY unread_count DESC, u.username`,
            [req.user.id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching connected users:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getUnreadCount, getConversations, getMessages, sendMessage, getConnectedUsers };
