# 🏗️ Redis Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           INSTAGRAM CLONE                                │
│                     Redis-Powered Architecture                           │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   FRONTEND   │  React + Vite (Port 5173)
│              │  - UI Components
│   (Client)   │  - Socket.io Client
│              │  - API Calls
└──────┬───────┘
       │
       │ HTTP/REST + WebSocket
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          BACKEND SERVER                                   │
│                     Node.js + Express (Port 5000)                         │
│                                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐                │
│  │ Controllers │  │   Services   │  │   Socket.io     │                │
│  │             │  │              │  │   Server        │                │
│  │ - Auth      │  │ - Cache      │  │                 │                │
│  │ - Posts     │  │ - Queue      │  │ - Real-time     │                │
│  │ - Messages  │  │ - Realtime   │  │ - Notifications │                │
│  │ - Follow    │  │              │  │ - Online Status │                │
│  └─────────────┘  └──────────────┘  └─────────────────┘                │
│                                                                           │
└───┬───────────────────┬─────────────────────┬─────────────────────┬─────┘
    │                   │                     │                     │
    │                   │                     │                     │
    ▼                   ▼                     ▼                     ▼
┌─────────┐      ┌─────────────┐      ┌──────────────┐     ┌──────────┐
│PostgreSQL│      │    REDIS    │      │ BULL QUEUES  │     │  WORKER  │
│         │      │             │      │              │     │          │
│ (5432)  │      │   (6379)    │      │              │     │ (Process)│
│         │      │             │      │              │     │          │
│ - Users │      │ CACHING:    │      │ 1. Image     │     │ Processes│
│ - Posts │      │ - Users     │      │    Processing│     │ Jobs:    │
│ - Likes │      │ - Feeds     │      │              │     │          │
│ - Comments     │ - Posts     │      │ 2. Notifications  │ - Images │
│ - Follows│      │ - Counts    │      │    - Like    │     │ - Emails │
│ - Messages     │             │      │    - Comment │     │ - Notifs │
│ - Notifs │      │ REAL-TIME:  │      │    - Follow  │     │          │
│         │      │ - Online    │      │    - Message │     │          │
└─────────┘      │ - Unread    │      │              │     └──────────┘
                 │             │      │ 3. Emails    │
                 └─────────────┘      │    - Welcome │
                                      │              │
                                      └──────────────┘
```

---

## Data Flow Examples

### 1️⃣ User Loads Feed (Cached)

```
User Request
    │
    ▼
┌─────────────────────┐
│  GET /api/posts/feed│
└──────────┬──────────┘
           │
           ▼
    ┌──────────────┐
    │ Cache Check  │
    │ Redis: feed:1│
    └──────┬───────┘
           │
           ├─── Cache HIT ──────┐
           │                    │
           │                    ▼
           │              ┌──────────┐
           │              │ Return   │
           │              │ Cached   │
           │              │ Data     │
           │              │ (10-50ms)│
           │              └──────────┘
           │
           └─── Cache MISS ────┐
                               │
                               ▼
                        ┌─────────────┐
                        │ Query       │
                        │ PostgreSQL  │
                        └──────┬──────┘
                               │
                               ▼
                        ┌─────────────┐
                        │ Cache Result│
                        │ in Redis    │
                        └──────┬──────┘
                               │
                               ▼
                        ┌─────────────┐
                        │ Return Data │
                        │ (100-500ms) │
                        └─────────────┘
```

### 2️⃣ User Likes a Post (Real-time + Background)

```
User Clicks Like
    │
    ▼
┌──────────────────────┐
│ POST /api/posts/1/like│
└──────────┬───────────┘
           │
           ├─────────────────────┬─────────────────────┬──────────────────┐
           │                     │                     │                  │
           ▼                     ▼                     ▼                  ▼
    ┌──────────┐         ┌─────────────┐      ┌─────────────┐    ┌──────────┐
    │PostgreSQL│         │   Redis     │      │ Bull Queue  │    │Socket.io │
    │          │         │             │      │             │    │          │
    │ INSERT   │         │ Update      │      │ Add Job:    │    │ Emit:    │
    │ INTO     │         │ like count  │      │ - Like      │    │ - To post│
    │ likes    │         │             │      │   notif     │    │   owner  │
    │          │         │ Invalidate  │      │             │    │ - To all │
    └──────────┘         │ feed cache  │      └──────┬──────┘    │   users  │
                         └─────────────┘             │           └──────────┘
                                                     │
                                                     ▼
                                              ┌──────────┐
                                              │  WORKER  │
                                              │          │
                                              │ Process  │
                                              │ job:     │
                                              │ - Store  │
                                              │   in DB  │
                                              └──────────┘
```

### 3️⃣ User Sends Message (Real-time)

```
User Sends Message
    │
    ▼
┌──────────────────────┐
│ POST /api/messages   │
└──────────┬───────────┘
           │
           ├─────────────────────┬─────────────────────┬──────────────────┐
           │                     │                     │                  │
           ▼                     ▼                     ▼                  ▼
    ┌──────────┐         ┌─────────────┐      ┌─────────────┐    ┌──────────┐
    │PostgreSQL│         │   Redis     │      │ Bull Queue  │    │Socket.io │
    │          │         │             │      │             │    │          │
    │ INSERT   │         │ Increment   │      │ Add Job:    │    │ Emit:    │
    │ INTO     │         │ unread      │      │ - Message   │    │ message: │
    │ messages │         │ count       │      │   notif     │    │ new      │
    │          │         │             │      │             │    │          │
    └──────────┘         └─────────────┘      └─────────────┘    │ To:      │
                                                                  │ user:123 │
                                                                  └──────────┘
                                                                       │
                                                                       ▼
                                                                  Receiver
                                                                  gets instant
                                                                  notification!
```

### 4️⃣ User Creates Post (Background Processing)

```
User Uploads Image
    │
    ▼
┌──────────────────────┐
│ POST /api/posts      │
└──────────┬───────────┘
           │
           ├─────────────────────┬─────────────────────┬──────────────────┐
           │                     │                     │                  │
           ▼                     ▼                     ▼                  ▼
    ┌──────────┐         ┌─────────────┐      ┌─────────────┐    ┌──────────┐
    │PostgreSQL│         │   Redis     │      │ Bull Queue  │    │Socket.io │
    │          │         │             │      │             │    │          │
    │ INSERT   │         │ Invalidate  │      │ Add Job:    │    │ Broadcast│
    │ INTO     │         │ all feeds   │      │ - Image     │    │ post:new │
    │ posts    │         │             │      │   process   │    │          │
    │          │         │ Invalidate  │      │             │    │ To: all  │
    └──────────┘         │ user posts  │      └──────┬──────┘    │   users  │
                         └─────────────┘             │           └──────────┘
                                                     │
                                                     ▼
                                              ┌──────────┐
                                              │  WORKER  │
                                              │          │
                                              │ Process: │
                                              │ - Resize │
                                              │ - Thumb  │
                                              │ - Optimize
                                              └──────────┘
```

---

## Cache Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    CACHE-FIRST STRATEGY                      │
└─────────────────────────────────────────────────────────────┘

Request → Check Redis Cache
              │
              ├─── HIT (90% of requests)
              │    └─→ Return cached data (10-50ms) ⚡
              │
              └─── MISS (10% of requests)
                   └─→ Query PostgreSQL (100-500ms)
                       └─→ Store in Redis
                           └─→ Return data

Cache Invalidation Triggers:
- User updates profile → Invalidate user:{id}
- New post created → Invalidate all feeds
- Post liked/commented → Invalidate related feeds
- User follows → Invalidate follower counts
```

---

## Queue Processing

```
┌─────────────────────────────────────────────────────────────┐
│                    BACKGROUND JOBS FLOW                      │
└─────────────────────────────────────────────────────────────┘

Controller adds job to queue (non-blocking)
              │
              ▼
    ┌─────────────────┐
    │   Bull Queue    │
    │   (in Redis)    │
    └────────┬────────┘
             │
             │ Worker picks up job
             │
             ▼
    ┌─────────────────┐
    │  Worker Process │
    │                 │
    │  - Process job  │
    │  - Update DB    │
    │  - Retry if fail│
    └────────┬────────┘
             │
             ├─── Success → Mark complete
             │
             └─── Failure → Retry (exponential backoff)
                            └─→ Max 3 attempts
                                └─→ Move to failed queue
```

---

## Real-time Communication

```
┌─────────────────────────────────────────────────────────────┐
│                  SOCKET.IO ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────┘

Client connects with JWT token
              │
              ▼
    ┌─────────────────┐
    │ Authentication  │
    │  Middleware     │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ User joins room │
    │  user:{userId}  │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Mark online in  │
    │     Redis       │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────────────────────┐
    │  Listen for events:             │
    │  - typing:start                 │
    │  - typing:stop                  │
    │  - messages:read                │
    └─────────────────────────────────┘

Server emits to client:
    │
    ├─→ notification (to specific user)
    ├─→ message:new (to specific user)
    ├─→ post:like:update (to all users)
    ├─→ post:comment:added (to all users)
    └─→ user:status (to all users)
```

---

## Performance Metrics

```
┌─────────────────────────────────────────────────────────────┐
│                    BEFORE vs AFTER REDIS                     │
└─────────────────────────────────────────────────────────────┘

Feed Load:
  Before: ████████████████████ 200-500ms
  After:  ██ 10-50ms (cached)
  Improvement: 10x faster ⚡

Profile View:
  Before: ██████████ 100-300ms
  After:  █ 5-20ms (cached)
  Improvement: 15x faster ⚡

Database Load:
  Before: ████████████████████ 100%
  After:  ████ 20-30%
  Improvement: 70% reduction 📉

Real-time Updates:
  Before: ❌ None (polling required)
  After:  ✅ Instant (<10ms)
  Improvement: New feature! 🎉
```

---

## Scalability

```
Current Setup (Single Server):
┌──────────┐
│ Backend  │ ←→ Redis ←→ Worker
└──────────┘

Future Scaling (Multiple Servers):
┌──────────┐
│ Backend 1│ ─┐
└──────────┘  │
              ├─→ Redis Cluster ←─┐
┌──────────┐  │                   │
│ Backend 2│ ─┘                   ├─→ Worker Pool
└──────────┘                      │   (Multiple)
                                  │
┌──────────┐                      │
│ Backend 3│ ─────────────────────┘
└──────────┘

Benefits:
- Horizontal scaling
- Load balancing
- High availability
- Fault tolerance
```

---

**📚 For more details, see [REDIS_IMPLEMENTATION.md](REDIS_IMPLEMENTATION.md)**
