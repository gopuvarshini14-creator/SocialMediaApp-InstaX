const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

console.log('Testing B2 Connection...');
console.log('Endpoint:', process.env.B2_ENDPOINT);
console.log('Region:', process.env.B2_REGION);
console.log('Bucket:', process.env.B2_BUCKET_NAME);
console.log('Key ID:', process.env.B2_APPLICATION_KEY_ID);
console.log('Key:', process.env.B2_APPLICATION_KEY ? '***' + process.env.B2_APPLICATION_KEY.slice(-4) : 'NOT SET');

// Configure Backblaze B2 S3-compatible client
const { NodeHttpHandler } = require("@aws-sdk/node-http-handler");
const https = require("https");

const s3Client = new S3Client({
    endpoint: process.env.B2_ENDPOINT,
    region: process.env.B2_REGION || 'us-east-005',
    credentials: {
        accessKeyId: process.env.B2_APPLICATION_KEY_ID,
        secretAccessKey: process.env.B2_APPLICATION_KEY,
    },
    forcePathStyle: true,
    requestHandler: new NodeHttpHandler({
        httpsAgent: new https.Agent({
            family: 4, // Force IPv4
            keepAlive: true,
        }),
    }),
});

async function testConnection() {
    try {
        console.log('\nAttempting to list buckets...');
        const command = new ListBucketsCommand({});
        const response = await s3Client.send(command);
        console.log('✅ Success! Buckets:', response.Buckets.map(b => b.Name));
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Error code:', error.Code || error.code);
        console.error('Error name:', error.name);
        if (error.$metadata) {
            console.error('HTTP Status:', error.$metadata.httpStatusCode);
        }
    }
}

testConnection();
