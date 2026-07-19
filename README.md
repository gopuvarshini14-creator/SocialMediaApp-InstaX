# Instagram Clone

A full-stack Instagram clone with a modern purple theme, built with React, Node.js, PostgreSQL, Redis, and Docker.

## Tech Stack

*   **Frontend**: React (Vite), CSS Modules/Global CSS
*   **Backend**: Node.js, Express
*   **Database**: PostgreSQL
*   **Cache/Queue**: Redis with Bull
*   **Real-time**: Socket.io
*   **Security**: End-to-End Encryption (E2EE)
*   **Containerization**: Docker, Docker Compose

## ✨ Features

### Core Features
*   **Authentication**: JWT-based Login and Registration
*   **Posts**: Create, view, like, comment, delete posts
*   **Feed**: Personalized feed with infinite scroll
*   **Explore**: Discover new content
*   **Messaging**: Real-time direct messaging with **end-to-end encryption** 🔒
*   **Follow System**: Follow/unfollow users
*   **User Profiles**: View and edit profiles

### 🔒 End-to-End Encrypted Messaging
*   **� RSA-OAEP Encryption**: Military-grade 2048-bit encryption
  - Only sender and receiver can read messages
  - Server cannot decrypt messages
  - Private keys never leave your device
*   **🔑 Automatic Key Management**: Keys generated and managed automatically
  - Client-side key generation
  - Secure key storage in localStorage
  - Public keys stored on server
*   **🎨 Visual Security Indicators**: Clear encryption status
  - Lock icons on encrypted messages
  - Encryption status badges
  - Green security theme

**📚 See [E2EE_IMPLEMENTATION.md](E2EE_IMPLEMENTATION.md) for detailed E2EE documentation**

### �🚀 Redis-Powered Features
*   **⚡ Caching**: Lightning-fast data retrieval (10x faster)
  - User profiles, feeds, posts cached with smart TTL
  - Automatic cache invalidation on updates
*   **🔄 Background Jobs**: Asynchronous processing
  - Image optimization and processing
  - Email notifications (welcome emails)
  - Database notification storage
*   **📡 Real-time Updates**: Instant notifications via Socket.io
  - Live like/comment notifications
  - Real-time messaging
  - Online/offline status
  - Typing indicators
  - Unread message counts

**📚 See [REDIS_IMPLEMENTATION.md](REDIS_IMPLEMENTATION.md) for detailed Redis documentation**


## Prerequisites

*   Docker and Docker Compose installed on your machine.

## Getting Started

1.  **Clone the repository** (if you haven't already).

2.  **Start the application**:
    ```bash
    docker-compose up --build
    ```

3.  **Run Database Migrations**:
    Open a new terminal and run:
    ```bash
    docker-compose exec backend npm run migrate
    ```

4.  **Access the Application**:
    *   Frontend: [http://localhost:5173](http://localhost:5173)
    *   Backend API: [http://localhost:5000](http://localhost:5000)

## Development

*   **Frontend**: Located in `frontend/`. Run `npm run dev` locally if not using Docker.
*   **Backend**: Located in `backend/`. Run `npm start` locally if not using Docker.

## Testing Redis Features

```bash
# Run Redis tests
docker-compose exec backend node test-redis.js test

# View queue statistics
docker-compose exec backend node test-redis.js stats

# Monitor worker logs
docker-compose logs -f worker

# Monitor Redis
docker-compose exec redis redis-cli MONITOR
```

## Documentation

*   **[REDIS_SUMMARY.md](REDIS_SUMMARY.md)** - Quick overview of Redis features
*   **[REDIS_IMPLEMENTATION.md](REDIS_IMPLEMENTATION.md)** - Complete implementation guide
*   **[UI_REDESIGN.md](UI_REDESIGN.md)** - UI design specifications

## Notes

*   The initial database migration must be run manually after the containers are up.
*   Redis is configured for caching, background workers, and real-time features.
*   Worker service processes background jobs automatically.
*   Socket.io handles real-time notifications and messaging.

