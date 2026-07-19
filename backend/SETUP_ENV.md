# Environment Setup Instructions

## Creating Your .env File

The application needs a `.env` file with Cloudinary credentials. Follow these steps:

### 1. Copy the Example File

```bash
cd c:\Users\srian\OneDrive\Desktop\media\instagram-clone\backend
Copy-Item .env.example .env
```

### 2. Get Cloudinary Credentials

1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account (if you don't have one)
3. After logging in, go to your Dashboard
4. You'll see three values:
   - **Cloud Name**
   - **API Key**
   - **API Secret** (click "Reveal" to see it)

### 3. Update the .env File

Open `.env` in your editor and replace the placeholder values:

```env
PORT=5000
DATABASE_URL=postgres://user:password@localhost:5432/instagram_clone
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://localhost:6379
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name_here
CLOUDINARY_API_KEY=your_actual_api_key_here
CLOUDINARY_API_SECRET=your_actual_api_secret_here
```

### 4. Restart the Server

After updating `.env`, restart your backend server:

```bash
# Stop the current server (Ctrl+C if running)
# Then start it again:
npm run dev
# or
node server.js
```

### 5. Verify Configuration

When the server starts, check the console. If credentials are set correctly, you should NOT see any Cloudinary-related errors. You can also run the test script:

```bash
node test-cloudinary.js
```

This will verify your Cloudinary connection works.

---

## Quick Reference

**File to create**: `c:\Users\srian\OneDrive\Desktop\media\instagram-clone\backend\.env`

**Required variables**:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Once configured, media uploads will work seamlessly!
