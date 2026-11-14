const express = require('express');
const router = express.Router();
const { login, getProfile } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Rate-limited login route
router.post('/login', authLimiter, login);

// Authenticated current profile route
router.get('/profile', verifyToken, getProfile);

module.exports = router;
