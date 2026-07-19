const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const cacheService = require('../services/cacheService');
const { queueService } = require('../services/queueService');
const { uploadToCloudinary } = require('../config/cloudinary');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const registerUser = async (req, res) => {
    const { username, email, password, full_name } = req.body;

    try {
        // Check if user exists
        const userExists = await query(
            'SELECT * FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = await query(
            'INSERT INTO users (username, email, password_hash, full_name) VALUES ($1, $2, $3, $4) RETURNING id, username, email, full_name, avatar_url',
            [username, email, hashedPassword, full_name]
        );

        const user = newUser.rows[0];

        // Cache user data
        await cacheService.cacheUser(user.id, user);

        // Queue welcome email
        await queueService.addWelcomeEmail({
            email: user.email,
            username: user.username
        });

        res.status(201).json({
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            avatar_url: user.avatar_url,
            token: generateToken(user.id),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (user && (await bcrypt.compare(password, user.password_hash))) {
            res.json({
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                avatar_url: user.avatar_url,
                token: generateToken(user.id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getMe = async (req, res) => {
    try {
        // Try to get from cache first
        const cachedUser = await cacheService.getUser(req.user.id);

        if (cachedUser) {
            console.log('User profile served from cache:', req.user.id);
            return res.json(cachedUser);
        }

        // If not in cache, fetch from database
        const result = await query(
            'SELECT id, username, email, full_name, bio, avatar_url FROM users WHERE id = $1',
            [req.user.id]
        );

        const user = result.rows[0];

        // Cache the user data
        await cacheService.cacheUser(req.user.id, user);

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Image is required' });
        }

        // Upload to Cloudinary using stream helper
        const result = await uploadToCloudinary(req.file.buffer, {
            folder: 'instagram-clone/avatars',
            resource_type: 'image'
        });

        const avatarUrl = result.secure_url;

        const dbResult = await query(
            'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, username, email, full_name, bio, avatar_url',
            [avatarUrl, req.user.id]
        );

        const user = dbResult.rows[0];

        // Invalidate cache
        await cacheService.invalidateUser(req.user.id);
        await cacheService.invalidateAllFeeds(); // Invalidate all feeds to update avatar in posts

        res.json(user);
    } catch (error) {
        console.error('Error updating profile picture:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getUserById = async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await query(
            'SELECT id, username, email, full_name, avatar_url, bio, created_at FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updatePublicKey = async (req, res) => {
    const { publicKey } = req.body;

    if (!publicKey) {
        return res.status(400).json({ message: 'Public key is required' });
    }

    try {
        await query(
            'UPDATE users SET public_key_e2ee = $1 WHERE id = $2',
            [publicKey, req.user.id]
        );

        res.json({ message: 'Public key updated successfully' });
    } catch (error) {
        console.error('Error updating public key:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getPublicKey = async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await query(
            'SELECT public_key_e2ee FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!result.rows[0].public_key_e2ee) {
            return res.status(404).json({ message: 'Public key not found for this user' });
        }

        res.json({ publicKey: result.rows[0].public_key_e2ee });
    } catch (error) {
        console.error('Error fetching public key:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { registerUser, loginUser, getMe, updateProfilePicture, getUserById, updatePublicKey, getPublicKey };
