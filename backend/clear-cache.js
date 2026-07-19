const cacheService = require('./services/cacheService');
const redisClient = require('./config/redis');

const clearCache = async () => {
    try {
        console.log('Waiting for Redis connection...');
        // Wait a bit for the auto-connect in config/redis.js to finish
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('Clearing cache...');
        await cacheService.invalidateAllFeeds();
        console.log('All feed caches invalidated');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

clearCache();
