const express = require('express');
const router = express.Router();
const {
  getCurrentSchool,
  updateCurrentSchool,
  getAllSchools,
  createSchool,
  updateSchoolById,
  deleteSchoolById
} = require('../controllers/schoolController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/current', getCurrentSchool);
router.put('/current', requireRole('super_admin'), updateCurrentSchool);
router.get('/', requireRole('super_admin'), getAllSchools);
router.post('/', requireRole('super_admin'), createSchool);
router.put('/:id', requireRole('super_admin'), updateSchoolById);
router.delete('/:id', requireRole('super_admin'), deleteSchoolById);

module.exports = router;
