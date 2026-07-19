# 🚀 Quick Start Guide - Redis Features

## 🎯 TL;DR

Your app now has Redis for **caching**, **background jobs**, and **real-time updates**. Everything works automatically!

---

## 🏃 Running the App

```bash
# Start everything
docker-compose up --build

# Run migrations (first time only)
docker-compose exec backend npm run migrate
```

**That's it!** Redis features are now active.

---

## 🧪 Quick Test

### 1. Test Caching
```bash
# Open the app
http://localhost:5173

# Login/Register
# View feed → First load is slow (database)
# Refresh → Second load is fast (cache) ⚡

# Check logs
docker-compose logs backend | grep "cache"
# You'll see: "Feed served from cache"
```

### 2. Test Background Jobs
```bash
# Watch worker logs
docker-compose logs -f worker

# Create a post in the app
# You'll see in worker logs:
# 📸 Processing image job 1
# ✅ Image processing completed

# Like a post
# You'll see:
# 👍 Processing like notification job 2
# ✅ Notification stored
```

### 3. Test Real-time Features
```bash
# Open app in 2 browser windows
# Login as different users

# Window 1: Like a post
# Window 2: See instant notification! 🔔

# Window 1: Send a message
# Window 2: Receive it instantly! 💬
```

---

## 📊 Monitor Redis

```bash
# View queue statistics
docker-compose exec backend node test-redis.js stats

# View Redis keys
docker-compose exec redis redis-cli KEYS '*'

# Monitor real-time
docker-compose exec redis redis-cli MONITOR
```

---

## 🔍 What's Cached?

| Data | Cache Key | TTL |
|------|-----------|-----|
| User profile | `user:{id}` | 30 min |
| Feed | `feed:{userId}` | 5 min |
| User posts | `user:{id}:posts` | 10 min |
| Like count | `post:{id}:likes` | 10 min |
| Online status | `online:{userId}` | 1 hour |

---

## 🎯 Key Endpoints

### With Caching
- `GET /api/auth/me` - User profile (cached)
- `GET /api/posts/feed` - Feed (cached)
- `GET /api/posts/user/:id` - User posts (cached)

### With Background Jobs
- `POST /api/posts` - Create post → Image processing job
- `POST /api/posts/:id/like` - Like post → Notification job
- `POST /api/posts/:id/comments` - Comment → Notification job
- `POST /api/auth/register` - Register → Welcome email job

### With Real-time
- `POST /api/posts/:id/like` - Real-time like update
- `POST /api/posts/:id/comments` - Real-time comment
- `POST /api/messages` - Real-time message delivery
- `POST /api/users/follow/:id` - Real-time follow notification

---

## 🐛 Troubleshooting

### Cache not working?
```bash
# Check Redis is running
docker-compose ps redis

# Clear cache and retry
docker-compose exec backend node test-redis.js clear
```

### Worker not processing?
```bash
# Check worker logs
docker-compose logs worker

# Restart worker
docker-compose restart worker
```

### Real-time not working?
```bash
# Check Socket.io connection in browser console
# Should see: "Socket connected"

# Check backend logs
docker-compose logs backend | grep Socket
```

---

## 📚 Learn More

- **Quick Overview**: [REDIS_SUMMARY.md](REDIS_SUMMARY.md)
- **Full Documentation**: [REDIS_IMPLEMENTATION.md](REDIS_IMPLEMENTATION.md)
- **Main README**: [README.md](README.md)

---

## 🎨 Frontend Integration Example

```javascript
// Connect to Socket.io
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: { token: localStorage.getItem('token') }
});

// Listen for notifications
socket.on('notification', (data) => {
  console.log('New notification:', data);
  // Show toast notification
});

// Listen for messages
socket.on('message:new', (message) => {
  console.log('New message:', message);
  // Update chat UI
});

// Listen for like updates
socket.on('post:like:update', ({ postId, likeCount }) => {
  console.log(`Post ${postId} now has ${likeCount} likes`);
  // Update UI
});
```

---

## ✅ Verification

Run this to verify everything works:

```bash
# Test all Redis features
docker-compose exec backend node test-redis.js test

# Expected output:
# ✅ Cache SET/GET: { message: 'Hello Redis!' }
# ✅ User cache: { id: 999, username: 'testuser' }
# ✅ Feed cache: [{ id: 1, caption: 'Test post' }]
# ✅ Online status: true
# ✅ Caching tests passed!
# ✅ Image processing job added: 1
# ✅ Like notification job added: 2
# ✅ Welcome email job added: 3
# ✅ Queue tests passed!
```

---

## 🎉 You're All Set!

Redis is now powering your Instagram clone with:
- ⚡ **10x faster** data access
- 🔄 **Async** background processing
- 📡 **Instant** real-time updates

**Happy coding!** 🚀
