const { imageProcessingQueue, notificationQueue, emailQueue } = require('../services/queueService');
const sharp = require('sharp');
const { query } = require('../config/db');

console.log('🚀 Worker started and listening for jobs...');

// ==================== IMAGE PROCESSING JOBS ====================

imageProcessingQueue.process(async (job) => {
    console.log(`📸 Processing image job ${job.id}:`, job.data);

    const { imageUrl, postId, userId } = job.data;

    try {
        // In a real scenario, you might:
        // 1. Download the image
        // 2. Create thumbnails
        // 3. Optimize the image
        // 4. Generate different sizes
        // 5. Update database with optimized versions

        console.log(`✅ Image processing completed for post ${postId}`);

        // Update job progress
        await job.progress(100);

        return { success: true, postId };
    } catch (error) {
        console.error(`❌ Image processing failed for job ${job.id}:`, error);
        throw error;
    }
});

// Image processing queue events
imageProcessingQueue.on('completed', (job, result) => {
    console.log(`✅ Image processing job ${job.id} completed:`, result);
});

imageProcessingQueue.on('failed', (job, err) => {
    console.error(`❌ Image processing job ${job.id} failed:`, err.message);
});

imageProcessingQueue.on('progress', (job, progress) => {
    console.log(`📊 Image processing job ${job.id} progress: ${progress}%`);
});

// ==================== NOTIFICATION JOBS ====================

notificationQueue.process('like', async (job) => {
    console.log(`👍 Processing like notification job ${job.id}:`, job.data);

    const { postId, postOwnerId, likerId, likerUsername } = job.data;

    try {
        // Store notification in database
        await query(
            `INSERT INTO notifications (user_id, type, message, related_user_id, related_post_id, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
                postOwnerId,
                'like',
                `${likerUsername} liked your post`,
                likerId,
                postId
            ]
        );

        console.log(`✅ Like notification stored for user ${postOwnerId}`);

        // Real-time notification will be sent by the controller
        return { success: true, type: 'like' };
    } catch (error) {
        console.error(`❌ Like notification failed for job ${job.id}:`, error);
        throw error;
    }
});

notificationQueue.process('comment', async (job) => {
    console.log(`💬 Processing comment notification job ${job.id}:`, job.data);

    const { postId, postOwnerId, commenterId, commenterUsername, commentText } = job.data;

    try {
        // Store notification in database
        await query(
            `INSERT INTO notifications (user_id, type, message, related_user_id, related_post_id, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
                postOwnerId,
                'comment',
                `${commenterUsername} commented: ${commentText.substring(0, 50)}`,
                commenterId,
                postId
            ]
        );

        console.log(`✅ Comment notification stored for user ${postOwnerId}`);

        return { success: true, type: 'comment' };
    } catch (error) {
        console.error(`❌ Comment notification failed for job ${job.id}:`, error);
        throw error;
    }
});

notificationQueue.process('follow', async (job) => {
    console.log(`👥 Processing follow notification job ${job.id}:`, job.data);

    const { followedUserId, followerId, followerUsername } = job.data;

    try {
        // Store notification in database
        await query(
            `INSERT INTO notifications (user_id, type, message, related_user_id, created_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [
                followedUserId,
                'follow',
                `${followerUsername} started following you`,
                followerId
            ]
        );

        console.log(`✅ Follow notification stored for user ${followedUserId}`);

        return { success: true, type: 'follow' };
    } catch (error) {
        console.error(`❌ Follow notification failed for job ${job.id}:`, error);
        throw error;
    }
});

notificationQueue.process('message', async (job) => {
    console.log(`✉️ Processing message notification job ${job.id}:`, job.data);

    const { receiverId, senderId, senderUsername, messageContent } = job.data;

    try {
        // Store notification in database
        await query(
            `INSERT INTO notifications (user_id, type, message, related_user_id, created_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [
                receiverId,
                'message',
                `${senderUsername} sent you a message`,
                senderId
            ]
        );

        console.log(`✅ Message notification stored for user ${receiverId}`);

        return { success: true, type: 'message' };
    } catch (error) {
        console.error(`❌ Message notification failed for job ${job.id}:`, error);
        throw error;
    }
});

// Notification queue events
notificationQueue.on('completed', (job, result) => {
    console.log(`✅ Notification job ${job.id} completed:`, result);
});

notificationQueue.on('failed', (job, err) => {
    console.error(`❌ Notification job ${job.id} failed:`, err.message);
});

// ==================== EMAIL JOBS ====================

emailQueue.process('welcome', async (job) => {
    console.log(`📧 Processing welcome email job ${job.id}:`, job.data);

    const { email, username } = job.data;

    try {
        // In a real scenario, you would send an email using a service like:
        // - SendGrid
        // - AWS SES
        // - Nodemailer

        console.log(`📧 Welcome email would be sent to ${email} for user ${username}`);

        // Simulate email sending
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log(`✅ Welcome email sent to ${email}`);

        return { success: true, email };
    } catch (error) {
        console.error(`❌ Welcome email failed for job ${job.id}:`, error);
        throw error;
    }
});

// Email queue events
emailQueue.on('completed', (job, result) => {
    console.log(`✅ Email job ${job.id} completed:`, result);
});

emailQueue.on('failed', (job, err) => {
    console.error(`❌ Email job ${job.id} failed:`, err.message);
});

// ==================== GRACEFUL SHUTDOWN ====================

process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received, closing queues gracefully...');
    await imageProcessingQueue.close();
    await notificationQueue.close();
    await emailQueue.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🛑 SIGINT received, closing queues gracefully...');
    await imageProcessingQueue.close();
    await notificationQueue.close();
    await emailQueue.close();
    process.exit(0);
});

console.log('✅ Worker is ready to process jobs from all queues');
