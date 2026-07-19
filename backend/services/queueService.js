const Queue = require('bull');
const redisClient = require('../config/redis');

/**
 * Queue Service for Background Jobs
 * Handles asynchronous tasks like image processing, notifications, email sending
 */

// Create queues for different job types
const imageProcessingQueue = new Queue('image-processing', {
    redis: {
        host: process.env.REDIS_URL?.split('://')[1]?.split(':')[0] || 'redis',
        port: parseInt(process.env.REDIS_URL?.split(':')[2] || '6379'),
    },
});

const notificationQueue = new Queue('notifications', {
    redis: {
        host: process.env.REDIS_URL?.split('://')[1]?.split(':')[0] || 'redis',
        port: parseInt(process.env.REDIS_URL?.split(':')[2] || '6379'),
    },
});

const emailQueue = new Queue('emails', {
    redis: {
        host: process.env.REDIS_URL?.split('://')[1]?.split(':')[0] || 'redis',
        port: parseInt(process.env.REDIS_URL?.split(':')[2] || '6379'),
    },
});

class QueueService {
    // ==================== IMAGE PROCESSING ====================

    /**
     * Add image processing job
     */
    async addImageProcessingJob(data) {
        try {
            const job = await imageProcessingQueue.add(data, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
            });
            console.log(`Image processing job added: ${job.id}`);
            return job;
        } catch (error) {
            console.error('Error adding image processing job:', error);
            throw error;
        }
    }

    // ==================== NOTIFICATIONS ====================

    /**
     * Add notification job for new like
     */
    async addLikeNotification(data) {
        try {
            const job = await notificationQueue.add('like', data, {
                attempts: 2,
                backoff: 1000,
            });
            console.log(`Like notification job added: ${job.id}`);
            return job;
        } catch (error) {
            console.error('Error adding like notification job:', error);
            throw error;
        }
    }

    /**
     * Add notification job for new comment
     */
    async addCommentNotification(data) {
        try {
            const job = await notificationQueue.add('comment', data, {
                attempts: 2,
                backoff: 1000,
            });
            console.log(`Comment notification job added: ${job.id}`);
            return job;
        } catch (error) {
            console.error('Error adding comment notification job:', error);
            throw error;
        }
    }

    /**
     * Add notification job for new follow
     */
    async addFollowNotification(data) {
        try {
            const job = await notificationQueue.add('follow', data, {
                attempts: 2,
                backoff: 1000,
            });
            console.log(`Follow notification job added: ${job.id}`);
            return job;
        } catch (error) {
            console.error('Error adding follow notification job:', error);
            throw error;
        }
    }

    /**
     * Add notification job for new message
     */
    async addMessageNotification(data) {
        try {
            const job = await notificationQueue.add('message', data, {
                attempts: 2,
                backoff: 1000,
            });
            console.log(`Message notification job added: ${job.id}`);
            return job;
        } catch (error) {
            console.error('Error adding message notification job:', error);
            throw error;
        }
    }

    // ==================== EMAIL ====================

    /**
     * Add welcome email job
     */
    async addWelcomeEmail(data) {
        try {
            const job = await emailQueue.add('welcome', data, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 5000,
                },
            });
            console.log(`Welcome email job added: ${job.id}`);
            return job;
        } catch (error) {
            console.error('Error adding welcome email job:', error);
            throw error;
        }
    }

    // ==================== QUEUE MANAGEMENT ====================

    /**
     * Get queue statistics
     */
    async getQueueStats(queueName) {
        let queue;
        switch (queueName) {
            case 'image-processing':
                queue = imageProcessingQueue;
                break;
            case 'notifications':
                queue = notificationQueue;
                break;
            case 'emails':
                queue = emailQueue;
                break;
            default:
                throw new Error('Invalid queue name');
        }

        const [waiting, active, completed, failed, delayed] = await Promise.all([
            queue.getWaitingCount(),
            queue.getActiveCount(),
            queue.getCompletedCount(),
            queue.getFailedCount(),
            queue.getDelayedCount(),
        ]);

        return {
            waiting,
            active,
            completed,
            failed,
            delayed,
        };
    }

    /**
     * Clean completed jobs
     */
    async cleanQueue(queueName, grace = 3600000) {
        let queue;
        switch (queueName) {
            case 'image-processing':
                queue = imageProcessingQueue;
                break;
            case 'notifications':
                queue = notificationQueue;
                break;
            case 'emails':
                queue = emailQueue;
                break;
            default:
                throw new Error('Invalid queue name');
        }

        await queue.clean(grace, 'completed');
        await queue.clean(grace, 'failed');
        console.log(`Cleaned ${queueName} queue`);
    }

    /**
     * Pause queue
     */
    async pauseQueue(queueName) {
        let queue;
        switch (queueName) {
            case 'image-processing':
                queue = imageProcessingQueue;
                break;
            case 'notifications':
                queue = notificationQueue;
                break;
            case 'emails':
                queue = emailQueue;
                break;
            default:
                throw new Error('Invalid queue name');
        }

        await queue.pause();
        console.log(`Paused ${queueName} queue`);
    }

    /**
     * Resume queue
     */
    async resumeQueue(queueName) {
        let queue;
        switch (queueName) {
            case 'image-processing':
                queue = imageProcessingQueue;
                break;
            case 'notifications':
                queue = notificationQueue;
                break;
            case 'emails':
                queue = emailQueue;
                break;
            default:
                throw new Error('Invalid queue name');
        }

        await queue.resume();
        console.log(`Resumed ${queueName} queue`);
    }
}

// Export queue instances and service
module.exports = {
    queueService: new QueueService(),
    imageProcessingQueue,
    notificationQueue,
    emailQueue,
};
