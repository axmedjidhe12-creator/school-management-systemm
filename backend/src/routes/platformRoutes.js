const express = require('express');
const router = express.Router();
const { getPlatformSettings, updatePlatformSettings } = require('../controllers/platformController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Public route for landing page & brand loader
router.get('/settings', getPlatformSettings);

// Master Admin route for saving web design & platform settings
router.put('/settings', verifyToken, requireRole('root_admin'), updatePlatformSettings);

module.exports = router;
