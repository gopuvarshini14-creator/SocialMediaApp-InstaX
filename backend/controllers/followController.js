const { query } = require('../config/db');
const { queueService } = require('../services/queueService');

const followUser = async (req, res) => {
    const { userId } = req.params;

    try {
        // Check if trying to follow self
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({ message: 'Cannot follow yourself' });
        }

        // Check if already following
        const existingFollow = await query(
            'SELECT * FROM follows WHERE follower_id = $1 AND following_id = $2',
            [req.user.id, userId]
        );

        if (existingFollow.rows.length > 0) {
            return res.status(400).json({ message: 'Already following this user' });
        }

        // Add follow
        await query(
            'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)',
            [req.user.id, userId]
        );

        // Get updated follower count
        const followerCount = await query(
            'SELECT COUNT(*) FROM follows WHERE following_id = $1',
            [userId]
        );

        // Get follower info for notification
        const followerInfo = await query(
            'SELECT username FROM users WHERE id = $1',
            [req.user.id]
        );

        // Queue follow notification
        await queueService.addFollowNotification({
            followedUserId: parseInt(userId),
            followerId: req.user.id,
            followerUsername: followerInfo.rows[0].username
        });

        // Send real-time notification
        const realtimeService = req.app.get('realtimeService');
        if (realtimeService) {
            await realtimeService.sendFollowNotification(
                parseInt(userId),
                {
                    id: req.user.id,
                    username: followerInfo.rows[0].username
                }
            );
        }

        res.json({
            message: 'User followed successfully',
            followerCount: parseInt(followerCount.rows[0].count),
            isFollowing: true
        });
    } catch (error) {
        console.error('Error following user:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


const unfollowUser = async (req, res) => {
    const { userId } = req.params;

    try {
        // Remove follow
        await query(
            'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
            [req.user.id, userId]
        );

        // Get updated follower count
        const followerCount = await query(
            'SELECT COUNT(*) FROM follows WHERE following_id = $1',
            [userId]
        );

        res.json({
            message: 'User unfollowed successfully',
            followerCount: parseInt(followerCount.rows[0].count),
            isFollowing: false
        });
    } catch (error) {
        console.error('Error unfollowing user:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getFollowStats = async (req, res) => {
    const { userId } = req.params;

    try {
        // Get follower count
        const followers = await query(
            'SELECT COUNT(*) FROM follows WHERE following_id = $1',
            [userId]
        );

        // Get following count
        const following = await query(
            'SELECT COUNT(*) FROM follows WHERE follower_id = $1',
            [userId]
        );

        // Check if current user follows this user
        let isFollowing = false;
        if (req.user && req.user.id !== parseInt(userId)) {
            const followCheck = await query(
                'SELECT * FROM follows WHERE follower_id = $1 AND following_id = $2',
                [req.user.id, userId]
            );
            isFollowing = followCheck.rows.length > 0;
        }

        res.json({
            followerCount: parseInt(followers.rows[0].count),
            followingCount: parseInt(following.rows[0].count),
            isFollowing
        });
    } catch (error) {
        console.error('Error getting follow stats:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const searchUsers = async (req, res) => {
    const { query: searchQuery } = req.query;

    if (!searchQuery || searchQuery.trim() === '') {
        return res.json([]);
    }

    try {
        const result = await query(
            `SELECT id, username, full_name, avatar_url 
             FROM users 
             WHERE username ILIKE $1 OR full_name ILIKE $1 
             LIMIT 10`,
            [`%${searchQuery}%`]
        );

        // Check follow status for each found user
        const usersWithFollowStatus = await Promise.all(result.rows.map(async (user) => {
            const followCheck = await query(
                'SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2',
                [req.user.id, user.id]
            );
            return {
                ...user,
                isFollowing: followCheck.rows.length > 0
            };
        }));

        res.json(usersWithFollowStatus);
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { followUser, unfollowUser, getFollowStats, searchUsers };
