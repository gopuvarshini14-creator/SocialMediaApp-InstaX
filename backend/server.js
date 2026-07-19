const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const RealtimeService = require('./services/realtimeService');
const cacheService = require('./services/cacheService');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all for now, restrict in production
        methods: ["GET", "POST"]
    }
});

// Initialize real-time service
const realtimeService = new RealtimeService(io);

// Make io and realtimeService available to routes
app.set('io', io);
app.set('realtimeService', realtimeService);

// Middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Instagram Clone API is running' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/users', require('./routes/followRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Socket.io Authentication Middleware
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        next();
    } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication error: Invalid token'));
    }
});

// Socket.io Connection Handler
io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`✅ User ${userId} connected with socket ${socket.id}`);

    // Handle user connection
    await realtimeService.handleConnection(socket, userId);

    // Handle typing events
    socket.on('typing:start', (data) => {
        const { receiverId } = data;
        realtimeService.notifyTyping(receiverId, userId, true);
    });

    socket.on('typing:stop', (data) => {
        const { receiverId } = data;
        realtimeService.notifyTyping(receiverId, userId, false);
    });

    // Handle message read status
    socket.on('messages:read', async (data) => {
        const { conversationId } = data;
        await cacheService.resetUnreadCount(userId);
        socket.emit('unread:update', {
            count: 0
        });
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
        console.log(`❌ User ${userId} disconnected`);
        await realtimeService.handleDisconnection(socket, userId);
    });
});

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.io server ready for real-time connections`);
});

module.exports = { app, io, realtimeService };

