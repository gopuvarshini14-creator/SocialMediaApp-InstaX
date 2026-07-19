const cacheService = require('../services/cacheService');

/**
 * Real-time Service for Socket.io events
 * Handles real-time notifications, online status, and live updates
 */

class RealtimeService {
    constructor(io) {
        this.io = io;
        this.userSockets = new Map(); // userId -> socketId mapping
    }

    /**
     * Initialize socket connection for a user
     */
    async handleConnection(socket, userId) {
        console.log(`User ${userId} connected with socket ${socket.id}`);

        // Store socket mapping
        this.userSockets.set(userId, socket.id);

        // Set user as online in Redis
        await cacheService.setUserOnline(userId, socket.id);

        // Join user's personal room
        socket.join(`user:${userId}`);

        // Notify followers that user is online
        this.broadcastUserStatus(userId, 'online');
    }

    /**
     * Handle user disconnection
     */
    async handleDisconnection(socket, userId) {
        console.log(`User ${userId} disconnected`);

        // Remove socket mapping
        this.userSockets.delete(userId);

        // Set user as offline in Redis
        await cacheService.setUserOffline(userId);

        // Notify followers that user is offline
        this.broadcastUserStatus(userId, 'offline');
    }

    /**
     * Broadcast user online/offline status
     */
    broadcastUserStatus(userId, status) {
        this.io.emit('user:status', {
            userId,
            status,
            timestamp: new Date(),
        });
    }

    /**
     * Send notification to a specific user
     */
    async sendNotification(userId, notification) {
        try {
            const socketId = await cacheService.getUserSocketId(userId);

            if (socketId) {
                // User is online, send real-time notification
                this.io.to(`user:${userId}`).emit('notification', notification);
                console.log(`Sent real-time notification to user ${userId}`);
            } else {
                // User is offline, notification will be stored in DB
                console.log(`User ${userId} is offline, notification stored for later`);
            }
        } catch (error) {
            console.error(`Error sending notification to user ${userId}:`, error);
        }
    }

    /**
     * Send like notification
     */
    async sendLikeNotification(postOwnerId, likerData, postId) {
        const notification = {
            type: 'like',
            message: `${likerData.username} liked your post`,
            user: likerData,
            postId,
            timestamp: new Date(),
        };

        await this.sendNotification(postOwnerId, notification);
    }

    /**
     * Send comment notification
     */
    async sendCommentNotification(postOwnerId, commenterData, postId, commentText) {
        const notification = {
            type: 'comment',
            message: `${commenterData.username} commented: ${commentText.substring(0, 50)}${commentText.length > 50 ? '...' : ''}`,
            user: commenterData,
            postId,
            timestamp: new Date(),
        };

        await this.sendNotification(postOwnerId, notification);
    }

    /**
     * Send follow notification
     */
    async sendFollowNotification(followedUserId, followerData) {
        const notification = {
            type: 'follow',
            message: `${followerData.username} started following you`,
            user: followerData,
            timestamp: new Date(),
        };

        await this.sendNotification(followedUserId, notification);
    }

    /**
     * Send message notification
     */
    async sendMessageNotification(receiverId, senderData, messageContent) {
        const notification = {
            type: 'message',
            message: `${senderData.username}: ${messageContent.substring(0, 50)}${messageContent.length > 50 ? '...' : ''}`,
            user: senderData,
            timestamp: new Date(),
        };

        await this.sendNotification(receiverId, notification);

        // Also increment unread count
        await cacheService.incrementUnreadCount(receiverId);

        // Send unread count update
        this.io.to(`user:${receiverId}`).emit('unread:update', {
            count: await cacheService.getUnreadCount(receiverId),
        });
    }

    /**
     * Broadcast new post to followers
     */
    async broadcastNewPost(userId, postData) {
        this.io.emit('post:new', {
            userId,
            post: postData,
            timestamp: new Date(),
        });
    }

    /**
     * Send real-time message
     */
    async sendMessage(receiverId, messageData) {
        try {
            const socketId = await cacheService.getUserSocketId(receiverId);

            if (socketId) {
                this.io.to(`user:${receiverId}`).emit('message:new', messageData);
                console.log(`Sent real-time message to user ${receiverId}`);
            }
        } catch (error) {
            console.error(`Error sending message to user ${receiverId}:`, error);
        }
    }

    /**
     * Notify typing status
     */
    notifyTyping(receiverId, senderId, isTyping) {
        this.io.to(`user:${receiverId}`).emit('typing', {
            senderId,
            isTyping,
        });
    }

    /**
     * Get online users count
     */
    getOnlineUsersCount() {
        return this.userSockets.size;
    }

    /**
     * Check if user is online
     */
    isUserOnline(userId) {
        return this.userSockets.has(userId);
    }

    /**
     * Get all online user IDs
     */
    getOnlineUserIds() {
        return Array.from(this.userSockets.keys());
    }

    /**
     * Broadcast to all connected users
     */
    broadcastToAll(event, data) {
        this.io.emit(event, data);
    }

    /**
     * Send update when post is liked/unliked
     */
    broadcastPostLikeUpdate(postId, likeCount, liked, userId) {
        this.io.emit('post:like:update', {
            postId,
            likeCount,
            liked,
            userId,
            timestamp: new Date(),
        });
    }

    /**
     * Send update when comment is added
     */
    broadcastCommentAdded(postId, comment) {
        this.io.emit('post:comment:added', {
            postId,
            comment,
            timestamp: new Date(),
        });
    }
}

module.exports = RealtimeService;
