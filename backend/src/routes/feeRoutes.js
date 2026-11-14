const express = require('express');
const router = express.Router();
const { getFees, recordFeePayment } = require('../controllers/feeController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// Students view own fee balance; Super Admin inspects all fees
router.get('/', getFees);

// Record payment (Super Admin)
router.post('/:id/pay', requireRole('super_admin'), recordFeePayment);

module.exports = router;
