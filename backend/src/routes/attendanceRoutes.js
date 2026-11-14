const express = require('express');
const router = express.Router();
const { getAttendance, recordBatchAttendance } = require('../controllers/attendanceController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// Student views own attendance; Teachers & Super Admin view school/class records
router.get('/', getAttendance);

// Record daily attendance and trigger automated absence email alerts
router.post('/batch', requireRole('super_admin', 'teacher'), recordBatchAttendance);

module.exports = router;
