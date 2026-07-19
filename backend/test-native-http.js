const https = require('https');

const url = 'https://s3.us-west-004.backblazeb2.com';

console.log(`Testing connection to ${url}...`);

const req = https.get(url, { family: 4 }, (res) => {
    console.log('statusCode:', res.statusCode);
    console.log('headers:', res.headers);

    res.on('data', (d) => {
        // Just consume data
    });
});

req.on('error', (e) => {
    console.error('❌ Error:', e);
});

req.end();
