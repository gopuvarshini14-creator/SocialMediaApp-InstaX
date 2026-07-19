const cloudinary = require('cloudinary').v2;
require('dotenv').config();

console.log('Testing Cloudinary Connection...');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key Present:', !!process.env.CLOUDINARY_API_KEY);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Try to ping Cloudinary
cloudinary.api.ping((error, result) => {
    if (error) {
        console.error('❌ Connection Failed:', error);
        process.exit(1);
    } else {
        console.log('✅ Connection Successful:', result);
        process.exit(0);
    }
});
