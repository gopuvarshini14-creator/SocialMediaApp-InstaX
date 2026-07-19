const redisClient = require('../config/redis');

/**
 * Cache Service for Redis operations
 * Handles caching of user data, posts, feeds, and other frequently accessed data
 */

class CacheService {
    constructor() {
        this.DEFAULT_EXPIRY = 3600; // 1 hour in seconds
        this.FEED_EXPIRY = 300; // 5 minutes
        this.USER_EXPIRY = 1800; // 30 minutes
        this.POST_EXPIRY = 600; // 10 minutes
    }

    /**
     * Generic get from cache
     */
    async get(key) {
        try {
            const data = await redisClient.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Cache GET error for key ${key}:`, error);
            return null;
        }
    }

    /**
     * Generic set to cache
     */
    async set(key, value, expiry = this.DEFAULT_EXPIRY) {
        try {
            await redisClient.setEx(key, expiry, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Cache SET error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Delete from cache
     */
    async del(key) {
        try {
            await redisClient.del(key);
            return true;
        } catch (error) {
            console.error(`Cache DEL error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Delete multiple keys matching a pattern
     */
    async delPattern(pattern) {
        try {
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
            return true;
        } catch (error) {
            console.error(`Cache DEL pattern error for ${pattern}:`, error);
            return false;
        }
    }

    // ==================== USER CACHING ====================

    /**
     * Cache user profile
     */
    async cacheUser(userId, userData) {
        const key = `user:${userId}`;
        return await this.set(key, userData, this.USER_EXPIRY);
    }

    /**
     * Get cached user profile
     */
    async getUser(userId) {
        const key = `user:${userId}`;
        return await this.get(key);
    }

    /**
     * Invalidate user cache
     */
    async invalidateUser(userId) {
        const key = `user:${userId}`;
        return await this.del(key);
    }

    // ==================== POST CACHING ====================

    /**
     * Cache a single post
     */
    async cachePost(postId, postData) {
        const key = `post:${postId}`;
        return await this.set(key, postData, this.POST_EXPIRY);
    }

    /**
     * Get cached post
     */
    async getPost(postId) {
        const key = `post:${postId}`;
        return await this.get(key);
    }

    /**
     * Invalidate post cache
     */
    async invalidatePost(postId) {
        const key = `post:${postId}`;
        return await this.del(key);
    }

    // ==================== FEED CACHING ====================

    /**
     * Cache user feed
     */
    async cacheFeed(userId, feedData) {
        const key = `feed:${userId}`;
        return await this.set(key, feedData, this.FEED_EXPIRY);
    }

    /**
     * Get cached feed
     */
    async getFeed(userId) {
        const key = `feed:${userId}`;
        return await this.get(key);
    }

    /**
     * Invalidate feed cache for a user
     */
    async invalidateFeed(userId) {
        const key = `feed:${userId}`;
        return await this.del(key);
    }

    /**
     * Invalidate all feeds (when new post is created)
     */
    async invalidateAllFeeds() {
        return await this.delPattern('feed:*');
    }

    // ==================== USER POSTS CACHING ====================

    /**
     * Cache user's posts
     */
    async cacheUserPosts(userId, posts) {
        const key = `user:${userId}:posts`;
        return await this.set(key, posts, this.POST_EXPIRY);
    }

    /**
     * Get cached user posts
     */
    async getUserPosts(userId) {
        const key = `user:${userId}:posts`;
        return await this.get(key);
    }

    /**
     * Invalidate user posts cache
     */
    async invalidateUserPosts(userId) {
        const key = `user:${userId}:posts`;
        return await this.del(key);
    }

    // ==================== LIKE COUNT CACHING ====================

    /**
     * Cache like count for a post
     */
    async cacheLikeCount(postId, count) {
        const key = `post:${postId}:likes`;
        return await this.set(key, count, this.POST_EXPIRY);
    }

    /**
     * Get cached like count
     */
    async getLikeCount(postId) {
        const key = `post:${postId}:likes`;
        return await this.get(key);
    }

    /**
     * Increment like count
     */
    async incrementLikeCount(postId) {
        const key = `post:${postId}:likes`;
        try {
            const count = await redisClient.incr(key);
            await redisClient.expire(key, this.POST_EXPIRY);
            return count;
        } catch (error) {
            console.error(`Error incrementing like count for post ${postId}:`, error);
            return null;
        }
    }

    /**
     * Decrement like count
     */
    async decrementLikeCount(postId) {
        const key = `post:${postId}:likes`;
        try {
            const count = await redisClient.decr(key);
            await redisClient.expire(key, this.POST_EXPIRY);
            return count;
        } catch (error) {
            console.error(`Error decrementing like count for post ${postId}:`, error);
            return null;
        }
    }

    // ==================== COMMENT COUNT CACHING ====================

    /**
     * Increment comment count
     */
    async incrementCommentCount(postId) {
        const key = `post:${postId}:comments`;
        try {
            const count = await redisClient.incr(key);
            await redisClient.expire(key, this.POST_EXPIRY);
            return count;
        } catch (error) {
            console.error(`Error incrementing comment count for post ${postId}:`, error);
            return null;
        }
    }

    // ==================== EXPLORE POSTS CACHING ====================

    /**
     * Cache explore posts
     */
    async cacheExplorePosts(posts) {
        const key = 'explore:posts';
        return await this.set(key, posts, this.FEED_EXPIRY);
    }

    /**
     * Get cached explore posts
     */
    async getExplorePosts() {
        const key = 'explore:posts';
        return await this.get(key);
    }

    // ==================== ONLINE USERS ====================

    /**
     * Set user as online
     */
    async setUserOnline(userId, socketId) {
        const key = `online:${userId}`;
        try {
            await redisClient.setEx(key, 3600, socketId); // 1 hour expiry
            return true;
        } catch (error) {
            console.error(`Error setting user ${userId} online:`, error);
            return false;
        }
    }

    /**
     * Set user as offline
     */
    async setUserOffline(userId) {
        const key = `online:${userId}`;
        return await this.del(key);
    }

    /**
     * Check if user is online
     */
    async isUserOnline(userId) {
        const key = `online:${userId}`;
        try {
            const socketId = await redisClient.get(key);
            return socketId !== null;
        } catch (error) {
            console.error(`Error checking if user ${userId} is online:`, error);
            return false;
        }
    }

    /**
     * Get user's socket ID
     */
    async getUserSocketId(userId) {
        const key = `online:${userId}`;
        try {
            return await redisClient.get(key);
        } catch (error) {
            console.error(`Error getting socket ID for user ${userId}:`, error);
            return null;
        }
    }

    // ==================== UNREAD MESSAGE COUNT ====================

    /**
     * Increment unread message count
     */
    async incrementUnreadCount(userId) {
        const key = `unread:${userId}`;
        try {
            const count = await redisClient.incr(key);
            return count;
        } catch (error) {
            console.error(`Error incrementing unread count for user ${userId}:`, error);
            return null;
        }
    }

    /**
     * Reset unread message count
     */
    async resetUnreadCount(userId) {
        const key = `unread:${userId}`;
        return await this.del(key);
    }

    /**
     * Get unread message count
     */
    async getUnreadCount(userId) {
        const key = `unread:${userId}`;
        try {
            const count = await redisClient.get(key);
            return count ? parseInt(count) : 0;
        } catch (error) {
            console.error(`Error getting unread count for user ${userId}:`, error);
            return 0;
        }
    }
}

module.exports = new CacheService();
