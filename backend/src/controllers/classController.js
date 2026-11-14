const pool = require('../config/db');

// GET /api/classes
const getClasses = async (req, res, next) => {
  try {
    const schoolId = req.user.school_id;

    const [classes] = await pool.query(
      `SELECT c.id, c.school_id, c.class_name, c.teacher_id,
              u.full_name AS teacher_name, u.email AS teacher_email,
              (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id AND s.deleted_at IS NULL) AS student_count
       FROM classes c
       LEFT JOIN users u ON u.id = c.teacher_id AND u.deleted_at IS NULL
       WHERE c.school_id = ? AND c.deleted_at IS NULL
       ORDER BY c.class_name ASC`,
      [schoolId]
    );

    res.json({ success: true, classes });
  } catch (error) {
    next(error);
  }
};

// POST /api/classes (Super Admin)
const createClass = async (req, res, next) => {
  try {
    const schoolId = req.user.school_id;
    const { class_name, teacher_id } = req.body;

    if (!class_name) {
      return res.status(400).json({ success: false, message: 'Class name is required.' });
    }

    const [result] = await pool.query(
      `INSERT INTO classes (school_id, class_name, teacher_id)
       VALUES (?, ?, ?)`,
      [schoolId, class_name.trim(), teacher_id || null]
    );

    res.status(201).json({
      success: true,
      message: 'Class created successfully.',
      classId: result.insertId
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/classes/:id (Super Admin)
const updateClass = async (req, res, next) => {
  try {
    const schoolId = req.user.school_id;
    const classId = req.params.id;
    const { class_name, teacher_id } = req.body;

    if (!class_name) {
      return res.status(400).json({ success: false, message: 'Class name is required.' });
    }

    const [result] = await pool.query(
      `UPDATE classes
       SET class_name = ?, teacher_id = ?
       WHERE id = ? AND school_id = ? AND deleted_at IS NULL`,
      [class_name.trim(), teacher_id || null, classId, schoolId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Class not found or already deleted.' });
    }

    res.json({ success: true, message: 'Class updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/classes/:id (Super Admin - Soft Delete)
const deleteClass = async (req, res, next) => {
  try {
    const schoolId = req.user.school_id;
    const classId = req.params.id;

    const [result] = await pool.query(
      `UPDATE classes
       SET deleted_at = NOW()
       WHERE id = ? AND school_id = ? AND deleted_at IS NULL`,
      [classId, schoolId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    res.json({ success: true, message: 'Class soft-deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClasses,
  createClass,
  updateClass,
  deleteClass
};
