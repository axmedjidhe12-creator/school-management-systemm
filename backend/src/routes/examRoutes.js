const express = require('express');
const router = express.Router();
const { getExams, recordExam, updateExam, deleteExam } = require('../controllers/examController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// Accessible by student (own records), teacher, super_admin
router.get('/', getExams);

// Record & update exams (Teacher & Super Admin)
router.post('/', requireRole('super_admin', 'teacher'), recordExam);
router.put('/:id', requireRole('super_admin', 'teacher'), updateExam);
router.delete('/:id', requireRole('super_admin', 'teacher'), deleteExam);

module.exports = router;
