# Backblaze B2 Setup Guide

## Step 1: Create a Backblaze B2 Account

1. Go to [backblaze.com/b2](https://www.backblaze.com/b2/cloud-storage.html)
2. Sign up for a free account (10GB free storage)
3. Verify your email and complete registration

## Step 2: Create a Bucket

1. Log into your Backblaze account
2. Go to **B2 Cloud Storage** → **Buckets**
3. Click **Create a Bucket**
4. Configure:
   - **Bucket Name**: `instagram-clone-media` (or your preferred name)
   - **Files in Bucket**: **Public**
   - **Encryption**: Disabled (or enable if you want)
   - **Object Lock**: Disabled
5. Click **Create a Bucket**

## Step 3: Create Application Keys

1. Go to **App Keys** in the left sidebar
2. Click **Add a New Application Key**
3. Configure:
   - **Name**: `instagram-clone-upload`
   - **Allow access to Bucket(s)**: Select your bucket
   - **Type of Access**: **Read and Write**
   - **Allow List All Bucket Names**: Yes (optional)
   - **File name prefix**: Leave empty
   - **Duration**: Leave empty (no expiration)
4. Click **Create New Key**
5. **IMPORTANT**: Copy both:
   - **keyID** (Application Key ID)
   - **applicationKey** (Application Key) - **This is shown only once!**

## Step 4: Get Your S3 Endpoint

1. In your bucket details, find the **Endpoint** information
2. It will look like: `s3.us-west-004.backblazeb2.com`
3. The region is the part after `s3.` (e.g., `us-west-004`)

## Step 5: Configure Environment Variables

Update your `.env` file in the backend directory:

```env
B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com
B2_REGION=us-west-004
B2_BUCKET_NAME=instagram-clone-media
B2_APPLICATION_KEY_ID=your_key_id_here
B2_APPLICATION_KEY=your_application_key_here
```

Replace:
- `us-west-004` with your actual region
- `instagram-clone-media` with your bucket name
- `your_key_id_here` with your Application Key ID
- `your_application_key_here` with your Application Key

## Step 6: Update Docker Compose

The environment variables are already configured in `docker-compose.yml` to read from your `.env` file.

## Step 7: Restart Services

```bash
cd c:\Users\srian\OneDrive\Desktop\media\instagram-clone
docker-compose down
docker-compose build backend worker
docker-compose up -d
```

## Pricing

- **Free Tier**: 10GB storage + 1GB daily download
- **Paid**: $0.005/GB/month storage + $0.01/GB download
- Much cheaper than Cloudinary!

## Testing

After setup, try uploading an image through your app. The file should appear in your B2 bucket under the `instagram-clone/images/` or `instagram-clone/videos/` folder.

## Troubleshooting

If uploads fail:
1. Check that your bucket is set to **Public**
2. Verify Application Key has **Read and Write** permissions
3. Check the backend logs: `docker-compose logs backend`
4. Ensure the endpoint URL is correct (should start with `https://`)
