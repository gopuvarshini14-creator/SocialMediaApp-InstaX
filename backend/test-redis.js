#!/usr/bin/env node

/**
 * Redis Features Test Script
 * Tests caching, background jobs, and provides monitoring utilities
 */

const redisClient = require('./config/redis');
const cacheService = require('./services/cacheService');
const { queueService, imageProcessingQueue, notificationQueue, emailQueue } = require('./services/queueService');

console.log('🧪 Redis Features Test Script\n');

async function testCaching() {
    console.log('📦 Testing Caching...');

    try {
        // Test basic cache operations
        await cacheService.set('test:key', { message: 'Hello Redis!' }, 60);
        const value = await cacheService.get('test:key');
        console.log('✅ Cache SET/GET:', value);

        // Test user caching
        await cacheService.cacheUser(999, { id: 999, username: 'testuser' });
        const user = await cacheService.getUser(999);
        console.log('✅ User cache:', user);

        // Test feed caching
        await cacheService.cacheFeed(999, [{ id: 1, caption: 'Test post' }]);
        const feed = await cacheService.getFeed(999);
        console.log('✅ Feed cache:', feed);

        // Test online status
        await cacheService.setUserOnline(999, 'socket-123');
        const isOnline = await cacheService.isUserOnline(999);
        console.log('✅ Online status:', isOnline);

        // Cleanup
        await cacheService.invalidateUser(999);
        await cacheService.invalidateFeed(999);
        await cacheService.setUserOffline(999);
        await cacheService.del('test:key');

        console.log('✅ Caching tests passed!\n');
    } catch (error) {
        console.error('❌ Caching test failed:', error);
    }
}

async function testQueues() {
    console.log('🔄 Testing Background Jobs...');

    try {
        // Test image processing job
        const imageJob = await queueService.addImageProcessingJob({
            imageUrl: 'https://example.com/test.jpg',
            postId: 999,
            userId: 1
        });
        console.log('✅ Image processing job added:', imageJob.id);

        // Test notification job
        const notifJob = await queueService.addLikeNotification({
            postId: 999,
            postOwnerId: 1,
            likerId: 2,
            likerUsername: 'testuser'
        });
        console.log('✅ Like notification job added:', notifJob.id);

        // Test email job
        const emailJob = await queueService.addWelcomeEmail({
            email: 'test@example.com',
            username: 'testuser'
        });
        console.log('✅ Welcome email job added:', emailJob.id);

        console.log('✅ Queue tests passed!\n');
    } catch (error) {
        console.error('❌ Queue test failed:', error);
    }
}

async function getQueueStats() {
    console.log('📊 Queue Statistics:\n');

    try {
        const queues = ['image-processing', 'notifications', 'emails'];

        for (const queueName of queues) {
            const stats = await queueService.getQueueStats(queueName);
            console.log(`${queueName}:`);
            console.log(`  Waiting: ${stats.waiting}`);
            console.log(`  Active: ${stats.active}`);
            console.log(`  Completed: ${stats.completed}`);
            console.log(`  Failed: ${stats.failed}`);
            console.log(`  Delayed: ${stats.delayed}\n`);
        }
    } catch (error) {
        console.error('❌ Failed to get queue stats:', error);
    }
}

async function getRedisInfo() {
    console.log('📈 Redis Information:\n');

    try {
        // Get all keys
        const keys = await redisClient.keys('*');
        console.log(`Total keys in Redis: ${keys.length}`);

        if (keys.length > 0) {
            console.log('\nSample keys:');
            keys.slice(0, 10).forEach(key => console.log(`  - ${key}`));
            if (keys.length > 10) {
                console.log(`  ... and ${keys.length - 10} more`);
            }
        }

        // Get memory usage
        const info = await redisClient.info('memory');
        const memoryMatch = info.match(/used_memory_human:(.+)/);
        if (memoryMatch) {
            console.log(`\nMemory usage: ${memoryMatch[1].trim()}`);
        }

        console.log('');
    } catch (error) {
        console.error('❌ Failed to get Redis info:', error);
    }
}

async function clearCache() {
    console.log('🧹 Clearing all cache...');

    try {
        const keys = await redisClient.keys('*');
        if (keys.length > 0) {
            await redisClient.del(keys);
            console.log(`✅ Cleared ${keys.length} keys\n`);
        } else {
            console.log('✅ Cache is already empty\n');
        }
    } catch (error) {
        console.error('❌ Failed to clear cache:', error);
    }
}

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'test':
            await testCaching();
            await testQueues();
            break;
        case 'stats':
            await getQueueStats();
            await getRedisInfo();
            break;
        case 'clear':
            await clearCache();
            break;
        case 'info':
            await getRedisInfo();
            break;
        default:
            console.log('Usage:');
            console.log('  node test-redis.js test   - Run all tests');
            console.log('  node test-redis.js stats  - Show queue and Redis stats');
            console.log('  node test-redis.js info   - Show Redis information');
            console.log('  node test-redis.js clear  - Clear all cache');
            console.log('');
    }

    // Close connections
    setTimeout(async () => {
        await redisClient.quit();
        await imageProcessingQueue.close();
        await notificationQueue.close();
        await emailQueue.close();
        process.exit(0);
    }, 2000);
}

main().catch(console.error);
