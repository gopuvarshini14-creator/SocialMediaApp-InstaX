const { query } = require('../config/db');

const getNotifications = async (req, res) => {
    try {
        const result = await query(
            `SELECT n.*, u.username, u.avatar_url, p.image_url as post_image
             FROM notifications n
             JOIN users u ON n.related_user_id = u.id
             LEFT JOIN posts p ON n.related_post_id = p.id
             WHERE n.user_id = $1
             ORDER BY n.created_at DESC
             LIMIT 50`,
            [req.user.id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const markAsRead = async (req, res) => {
    try {
        await query(
            'UPDATE notifications SET is_read = true WHERE user_id = $1',
            [req.user.id]
        );
        res.json({ message: 'Notifications marked as read' });
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getUnreadCount = async (req, res) => {
    try {
        const result = await query(
            'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
            [req.user.id]
        );
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (error) {
        console.error('Error fetching unread notification count:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getNotifications, markAsRead, getUnreadCount };
