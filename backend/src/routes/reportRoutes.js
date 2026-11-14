const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getEmailAuditLogs,
  sendCustomEmail,
  sendSchoolOfficialEmail,
  getMaintenanceStatus,
  optimizeDatabase,
  getPlatformOverview
} = require('../controllers/reportController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { emailLimiter } = require('../middleware/rateLimiter');

router.use(verifyToken);
router.use(requireRole('super_admin'));

// Super admin reports and metrics
router.get('/platform-overview', getPlatformOverview);
router.get('/dashboard-stats', getDashboardStats);
router.get('/email-logs', getEmailAuditLogs);
router.post('/send-custom-email', emailLimiter, sendCustomEmail);
router.post('/send-school-email', emailLimiter, sendSchoolOfficialEmail);
router.get('/maintenance', getMaintenanceStatus);
router.post('/maintenance/optimize', optimizeDatabase);

module.exports = router;
