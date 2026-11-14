const express = require('express');
const router = express.Router();
const { getClasses, createClass, updateClass, deleteClass } = require('../controllers/classController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', getClasses);
router.post('/', requireRole('super_admin'), createClass);
router.put('/:id', requireRole('super_admin'), updateClass);
router.delete('/:id', requireRole('super_admin'), deleteClass);

module.exports = router;
