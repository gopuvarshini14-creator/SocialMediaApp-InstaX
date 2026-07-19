const { query } = require('../config/db');
const cacheService = require('../services/cacheService');
const { queueService } = require('../services/queueService');
const { uploadToCloudinary, cloudinary } = require('../config/cloudinary');

const createPost = async (req, res) => {
    console.log('=== CREATE POST ===');
    const { caption } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded. Please select an image or video.' });
    }

    try {
        // Upload to Cloudinary using the stream helper
        const result = await uploadToCloudinary(req.file.buffer, {
            folder: req.file.mimetype.startsWith('video/') ? 'instagram-clone/videos' : 'instagram-clone/images',
            resource_type: 'auto'
        });

        const mediaUrl = result.secure_url;
        const mediaType = result.resource_type === 'video' ? 'video' : 'image';

        const dbResult = await query(
            'INSERT INTO posts (user_id, image_url, video_url, media_type, caption) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [
                req.user.id,
                mediaType === 'image' ? mediaUrl : null,
                mediaType === 'video' ? mediaUrl : null,
                mediaType,
                caption
            ]
        );

        const post = dbResult.rows[0];
        console.log('Post created successfully:', post.id);

        // Invalidate all feeds cache since new post is created
        await cacheService.invalidateAllFeeds();

        // Invalidate user's posts cache
        await cacheService.invalidateUserPosts(req.user.id);

        // Add media processing job to queue
        if (mediaType === 'image') {
            await queueService.addImageProcessingJob({
                imageUrl: mediaUrl,
                postId: post.id,
                userId: req.user.id
            });
        }

        // Broadcast new post to real-time service
        const realtimeService = req.app.get('realtimeService');
        if (realtimeService) {
            await realtimeService.broadcastNewPost(req.user.id, post);
        }

        res.status(201).json(post);
    } catch (error) {
        console.error('ERROR creating post:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getFeed = async (req, res) => {
    try {
        // Try to get from cache first
        const cachedFeed = await cacheService.getFeed(req.user.id);

        if (cachedFeed) {
            console.log('Feed served from cache for user:', req.user.id);
            return res.json(cachedFeed);
        }

        // If not in cache, fetch from database
        const result = await query(
            `SELECT p.*, u.username, u.avatar_url,
                    COUNT(DISTINCT l.id) as like_count,
                    COUNT(DISTINCT c.id) as comment_count,
                    EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1) as liked_by_user
             FROM posts p 
             JOIN users u ON p.user_id = u.id 
             LEFT JOIN likes l ON p.id = l.post_id
             LEFT JOIN comments c ON p.id = c.post_id
             GROUP BY p.id, u.username, u.avatar_url
             ORDER BY p.created_at DESC 
             LIMIT 20`,
            [req.user.id]
        );

        // Cache the feed
        await cacheService.cacheFeed(req.user.id, result.rows);

        console.log('Feed served from database for user:', req.user.id);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getExplorePosts = async (req, res) => {
    try {
        const result = await query(
            `SELECT p.*, u.username, u.avatar_url,
                    COUNT(DISTINCT l.id) as like_count,
                    COUNT(DISTINCT c.id) as comment_count,
                    EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1) as liked_by_user
             FROM posts p 
             JOIN users u ON p.user_id = u.id 
             LEFT JOIN likes l ON p.id = l.post_id
             LEFT JOIN comments c ON p.id = c.post_id
             GROUP BY p.id, u.username, u.avatar_url
             ORDER BY RANDOM() 
             LIMIT 20`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getUserPosts = async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await query(
            `SELECT p.*, u.username, u.avatar_url,
                    COUNT(DISTINCT l.id) as like_count,
                    COUNT(DISTINCT c.id) as comment_count,
                    EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1) as liked_by_user
             FROM posts p 
             JOIN users u ON p.user_id = u.id 
             LEFT JOIN likes l ON p.id = l.post_id
             LEFT JOIN comments c ON p.id = c.post_id
             WHERE p.user_id = $2
             GROUP BY p.id, u.username, u.avatar_url
             ORDER BY p.created_at DESC`,
            [req.user.id, userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const likePost = async (req, res) => {
    const { postId } = req.params;
    try {
        const existingLike = await query(
            'SELECT * FROM likes WHERE post_id = $1 AND user_id = $2',
            [postId, req.user.id]
        );

        if (existingLike.rows.length > 0) {
            return res.status(400).json({ message: 'Post already liked' });
        }

        await query(
            'INSERT INTO likes (post_id, user_id) VALUES ($1, $2)',
            [postId, req.user.id]
        );

        const likeCount = await query(
            'SELECT COUNT(*) FROM likes WHERE post_id = $1',
            [postId]
        );

        const count = parseInt(likeCount.rows[0].count);

        await cacheService.cacheLikeCount(postId, count);
        await cacheService.invalidateFeed(req.user.id);

        const postResult = await query(
            'SELECT user_id FROM posts WHERE id = $1',
            [postId]
        );

        const postOwnerId = postResult.rows[0].user_id;

        if (postOwnerId !== req.user.id) {
            await queueService.addLikeNotification({
                postId,
                postOwnerId,
                likerId: req.user.id,
                likerUsername: req.user.username
            });

            const realtimeService = req.app.get('realtimeService');
            if (realtimeService) {
                await realtimeService.sendLikeNotification(
                    postOwnerId,
                    { id: req.user.id, username: req.user.username },
                    postId
                );
                realtimeService.broadcastPostLikeUpdate(postId, count, true, req.user.id);
            }
        }

        res.json({
            message: 'Post liked',
            likeCount: count,
            liked: true
        });
    } catch (error) {
        console.error('Error liking post:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const unlikePost = async (req, res) => {
    const { postId } = req.params;
    try {
        await query(
            'DELETE FROM likes WHERE post_id = $1 AND user_id = $2',
            [postId, req.user.id]
        );

        const likeCount = await query(
            'SELECT COUNT(*) FROM likes WHERE post_id = $1',
            [postId]
        );

        const count = parseInt(likeCount.rows[0].count);

        await cacheService.cacheLikeCount(postId, count);
        await cacheService.invalidateFeed(req.user.id);

        const realtimeService = req.app.get('realtimeService');
        if (realtimeService) {
            realtimeService.broadcastPostLikeUpdate(postId, count, false, req.user.id);
        }

        res.json({
            message: 'Post unliked',
            likeCount: count,
            liked: false
        });
    } catch (error) {
        console.error('Error unliking post:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const addComment = async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
        return res.status(400).json({ message: 'Comment content is required' });
    }

    try {
        const result = await query(
            `INSERT INTO comments (post_id, user_id, content) 
             VALUES ($1, $2, $3) 
             RETURNING id, post_id, user_id, content, created_at`,
            [postId, req.user.id, content.trim()]
        );

        const userInfo = await query(
            'SELECT username, avatar_url FROM users WHERE id = $1',
            [req.user.id]
        );

        const comment = {
            ...result.rows[0],
            username: userInfo.rows[0].username,
            avatar_url: userInfo.rows[0].avatar_url
        };

        await cacheService.invalidateFeed(req.user.id);

        const postResult = await query(
            'SELECT user_id FROM posts WHERE id = $1',
            [postId]
        );

        const postOwnerId = postResult.rows[0].user_id;

        if (postOwnerId !== req.user.id) {
            await queueService.addCommentNotification({
                postId,
                postOwnerId,
                commenterId: req.user.id,
                commenterUsername: req.user.username,
                commentText: content.trim()
            });

            const realtimeService = req.app.get('realtimeService');
            if (realtimeService) {
                await realtimeService.sendCommentNotification(
                    postOwnerId,
                    { id: req.user.id, username: req.user.username },
                    postId,
                    content.trim()
                );
                realtimeService.broadcastCommentAdded(postId, comment);
            }
        }

        res.status(201).json(comment);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getComments = async (req, res) => {
    const { postId } = req.params;
    try {
        const result = await query(
            `SELECT c.id, c.post_id, c.user_id, c.content, c.created_at,
                    u.username, u.avatar_url
             FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.post_id = $1
             ORDER BY c.created_at DESC`,
            [postId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deletePost = async (req, res) => {
    const { postId } = req.params;

    try {
        const postResult = await query(
            'SELECT * FROM posts WHERE id = $1',
            [postId]
        );

        if (postResult.rows.length === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const post = postResult.rows[0];

        if (post.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this post' });
        }

        // Extract public_id from Cloudinary URL and delete
        if (post.image_url || post.video_url) {
            const url = post.image_url || post.video_url;
            const urlParts = url.split('/');
            const fileNameWithExt = urlParts[urlParts.length - 1];
            const fileName = fileNameWithExt.split('.')[0];
            const folder = urlParts[urlParts.length - 2];
            const publicId = `${folder}/${fileName}`;

            await cloudinary.uploader.destroy(publicId);
        }

        await query('DELETE FROM posts WHERE id = $1', [postId]);

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { createPost, getFeed, getExplorePosts, getUserPosts, likePost, unlikePost, addComment, getComments, deletePost };
