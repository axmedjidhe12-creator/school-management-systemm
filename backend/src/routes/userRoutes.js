const express = require('express');
const router = express.Router();
const {
  getTeachers,
  getStudents,
  createTeacher,
  updateTeacher,
  createStudent,
  updateStudent,
  deleteUser,
  getTrashRecords,
  restoreRecord
} = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// Accessible by super_admin and teachers (e.g. form masters need student lists)
router.get('/teachers', getTeachers);
router.get('/students', getStudents);

// Super admin user management
router.post('/teachers', requireRole('super_admin'), createTeacher);
router.put('/teachers/:id', requireRole('super_admin'), updateTeacher);
router.post('/students', requireRole('super_admin'), createStudent);
router.put('/students/:id', requireRole('super_admin'), updateStudent);
router.delete('/:id', requireRole('super_admin'), deleteUser);

// Soft delete restoration
router.get('/trash', requireRole('super_admin'), getTrashRecords);
router.post('/restore', requireRole('super_admin'), restoreRecord);

module.exports = router;
