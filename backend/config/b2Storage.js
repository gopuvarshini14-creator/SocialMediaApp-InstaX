const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
require('dotenv').config();

const { NodeHttpHandler } = require("@aws-sdk/node-http-handler");
const https = require("https");

// Configure Backblaze B2 S3-compatible client
const s3Client = new S3Client({
    endpoint: process.env.B2_ENDPOINT, // e.g., https://s3.us-west-004.backblazeb2.com
    region: process.env.B2_REGION || 'us-west-004',
    credentials: {
        accessKeyId: process.env.B2_APPLICATION_KEY_ID,
        secretAccessKey: process.env.B2_APPLICATION_KEY,
    },
    forcePathStyle: true, // Required for B2
    requestHandler: new NodeHttpHandler({
        httpsAgent: new https.Agent({
            family: 4, // Force IPv4
            keepAlive: true,
        }),
    }),
});

// Storage for images
const imageStorage = multerS3({
    s3: s3Client,
    bucket: process.env.B2_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `instagram-clone/images/${uniqueSuffix}-${file.originalname}`);
    }
});

// Storage for videos
const videoStorage = multerS3({
    s3: s3Client,
    bucket: process.env.B2_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `instagram-clone/videos/${uniqueSuffix}-${file.originalname}`);
    }
});

// Storage for both images and videos
const mediaStorage = multerS3({
    s3: s3Client,
    bucket: process.env.B2_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
        const isVideo = file.mimetype.startsWith('video/');
        const folder = isVideo ? 'videos' : 'images';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `instagram-clone/${folder}/${uniqueSuffix}-${file.originalname}`);
    }
});

const upload = multer({ storage: imageStorage });
const uploadVideo = multer({ storage: videoStorage });
const uploadMedia = multer({ storage: mediaStorage });

const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const getPresignedUrl = async (key) => {
    if (!key) return null;

    // If it's already a full URL, extract the key
    if (key.startsWith('http')) {
        const urlParts = key.split('.com/');
        if (urlParts.length > 1) {
            key = urlParts[1];
        }
    }

    const command = new GetObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME,
        Key: key,
    });

    try {
        // URL expires in 1 hour (3600 seconds)
        return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    } catch (error) {
        console.error('Error generating presigned URL:', error);
        return key; // Fallback to original key/url
    }
};

module.exports = {
    s3Client,
    upload,
    uploadVideo,
    uploadMedia,
    getPresignedUrl
};
