const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, updateProfilePicture, getUserById, updatePublicKey, getPublicKey } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.post('/profile-picture', protect, upload.single('avatar'), updateProfilePicture);
router.get('/user/:userId', protect, getUserById);

// E2EE public key routes
router.post('/public-key', protect, updatePublicKey);
router.get('/public-key/:userId', protect, getPublicKey);

module.exports = router;

