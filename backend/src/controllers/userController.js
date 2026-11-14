const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// GET /api/users/teachers
const getTeachers = async (req, res, next) => {
  try {
    const schoolId = req.user.school_id;

    const [teachers] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.role, u.avatar_url, u.subject, u.assigned_classes, u.created_at,
              c.id AS form_master_class_id, c.class_name AS form_master_class_name
       FROM users u
       LEFT JOIN classes c ON c.teacher_id = u.id AND c.deleted_at IS NULL
       WHERE u.school_id = ? AND u.role = 'teacher' AND u.deleted_at IS NULL
       ORDER BY u.full_name ASC`,
      [schoolId]
    );

    res.json({ success: true, teachers });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/students
const getStudents = async (req, res, next) => {
  try {
    const schoolId = req.user.school_id;
    const { class_id } = req.query;

    let query = `
      SELECT st.id AS student_id, st.admission_no, u.created_at,
             u.id AS user_id, u.full_name, u.email, u.avatar_url,
             c.id AS class_id, c.class_name,
             f.amount_due, f.amount_paid, f.status AS fee_status
      FROM students st
      JOIN users u ON u.id = st.user_id AND u.deleted_at IS NULL
      JOIN classes c ON c.id = st.class_id AND c.deleted_at IS NULL
      LEFT JOIN fees f ON f.student_id = st.id AND f.deleted_at IS NULL
      WHERE st.school_id = ? AND st.deleted_at IS NULL
    `;
    const params = [schoolId];

    if (class_id) {
      query += ` AND st.class_id = ?`;
      params.push(class_id);
    }

    query += ` ORDER BY c.class_name ASC, u.full_name ASC`;

    const [students] = await pool.query(query, params);
    res.json({ success: true, students });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/teachers (Super Admin)
const createTeacher = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const schoolId = req.user.school_id;
    const { full_name, email, password, subject, assigned_classes, form_master_class_id, avatar_url } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email, and password are required.' });
    }

    await connection.beginTransaction();

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [result] = await connection.query(
      `INSERT INTO users (school_id, full_name, email, password_hash, role, subject, assigned_classes, avatar_url)
       VALUES (?, ?, ?, ?, 'teacher', ?, ?, ?)`,
      [
        schoolId,
        full_name.trim(),
        email.trim().toLowerCase(),
        passwordHash,
        subject ? subject.trim() : null,
        assigned_classes ? (Array.isArray(assigned_classes) ? assigned_classes.join(', ') : assigned_classes.trim()) : null,
        avatar_url || null
      ]
    );

    const teacherId = result.insertId;

    // If assigned as Form Master for a class, update that class
    if (form_master_class_id) {
      await connection.query(
        `UPDATE classes SET teacher_id = ? WHERE id = ? AND school_id = ?`,
        [teacherId, form_master_class_id, schoolId]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Teacher account registered successfully.',
      userId: teacherId
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// PUT /api/users/teachers/:id (Super Admin - Update Teacher Profile, Subject, Classes)
const updateTeacher = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const schoolId = req.user.school_id;
    const teacherId = req.params.id;
    const { full_name, email, subject, assigned_classes, form_master_class_id, avatar_url } = req.body;

    if (!full_name || !email) {
      return res.status(400).json({ success: false, message: 'Full name and email are required.' });
    }

    await connection.beginTransaction();

    await connection.query(
      `UPDATE users
       SET full_name = ?, email = ?, subject = ?, assigned_classes = ?, avatar_url = COALESCE(?, avatar_url)
       WHERE id = ? AND school_id = ? AND role = 'teacher' AND deleted_at IS NULL`,
      [
        full_name.trim(),
        email.trim().toLowerCase(),
        subject ? subject.trim() : null,
        assigned_classes ? (Array.isArray(assigned_classes) ? assigned_classes.join(', ') : assigned_classes.trim()) : null,
        avatar_url || null,
        teacherId,
        schoolId
      ]
    );

    // Unassign previous class where this teacher was form master
    await connection.query(
      `UPDATE classes SET teacher_id = NULL WHERE teacher_id = ? AND school_id = ?`,
      [teacherId, schoolId]
    );

    // Re-assign form master class if specified
    if (form_master_class_id) {
      await connection.query(
        `UPDATE classes SET teacher_id = ? WHERE id = ? AND school_id = ?`,
        [teacherId, form_master_class_id, schoolId]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Teacher profile, subjects, and class assignments updated successfully.'
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// POST /api/users/students (Super Admin)
const createStudent = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const schoolId = req.user.school_id;
    const { full_name, email, password, class_id, admission_no, tuition_amount, avatar_url } = req.body;

    if (!full_name || !email || !password || !class_id || !admission_no) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, password, class_id, and admission_no are required.'
      });
    }

    await connection.beginTransaction();

    // 1. Create User
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [userResult] = await connection.query(
      `INSERT INTO users (school_id, full_name, email, password_hash, role, avatar_url)
       VALUES (?, ?, ?, ?, 'student', ?)`,
      [schoolId, full_name.trim(), email.trim().toLowerCase(), passwordHash, avatar_url || null]
    );
    const userId = userResult.insertId;

    // 2. Create Student Profile
    const [studentResult] = await connection.query(
      `INSERT INTO students (school_id, user_id, class_id, admission_no)
       VALUES (?, ?, ?, ?)`,
      [schoolId, userId, class_id, admission_no.trim()]
    );
    const studentId = studentResult.insertId;

    // 3. Initialize Tuition Fee Record
    const initialDue = tuition_amount !== undefined ? Number(tuition_amount) : 1500.00;
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + 3);

    await connection.query(
      `INSERT INTO fees (school_id, student_id, amount_due, amount_paid, status, due_date)
       VALUES (?, ?, ?, 0.00, 'unpaid', ?)`,
      [schoolId, studentId, initialDue, dueDate.toISOString().split('T')[0]]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Student account and profile created successfully.',
      studentId,
      userId
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// DELETE /api/users/:id (Super Admin - Soft Delete)
const deleteUser = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const schoolId = req.user.school_id;
    const userId = req.params.id;

    if (Number(userId) === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }

    await connection.beginTransaction();

    // Soft delete user
    const [userRes] = await connection.query(
      `UPDATE users SET deleted_at = NOW() WHERE id = ? AND school_id = ? AND deleted_at IS NULL`,
      [userId, schoolId]
    );

    if (userRes.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'User not found or already deleted.' });
    }

    // Soft delete student profile if exists
    await connection.query(
      `UPDATE students SET deleted_at = NOW() WHERE user_id = ? AND school_id = ? AND deleted_at IS NULL`,
      [userId, schoolId]
    );

    // Unassign classes if teacher
    await connection.query(
      `UPDATE classes SET teacher_id = NULL WHERE teacher_id = ? AND school_id = ?`,
      [userId, schoolId]
    );

    await connection.commit();
    res.json({ success: true, message: 'User record soft-deleted successfully.' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// GET /api/users/trash (Super Admin - View soft-deleted records)
const getTrashRecords = async (req, res, next) => {
  try {
    const schoolId = req.user.school_id;

    const [deletedUsers] = await pool.query(
      `SELECT id, full_name, email, role, avatar_url, deleted_at
       FROM users
       WHERE school_id = ? AND deleted_at IS NOT NULL
       ORDER BY deleted_at DESC`,
      [schoolId]
    );

    const [deletedClasses] = await pool.query(
      `SELECT id, class_name, deleted_at
       FROM classes
       WHERE school_id = ? AND deleted_at IS NOT NULL
       ORDER BY deleted_at DESC`,
      [schoolId]
    );

    res.json({
      success: true,
      trash: {
        users: deletedUsers,
        classes: deletedClasses
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/restore (Super Admin - Restore soft-deleted record)
const restoreRecord = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const schoolId = req.user.school_id;
    const { type, id } = req.body;

    if (!type || !id) {
      return res.status(400).json({ success: false, message: 'Record type and id are required.' });
    }

    await connection.beginTransaction();

    if (type === 'user') {
      await connection.query(
        `UPDATE users SET deleted_at = NULL WHERE id = ? AND school_id = ?`,
        [id, schoolId]
      );
      await connection.query(
        `UPDATE students SET deleted_at = NULL WHERE user_id = ? AND school_id = ?`,
        [id, schoolId]
      );
    } else if (type === 'class') {
      await connection.query(
        `UPDATE classes SET deleted_at = NULL WHERE id = ? AND school_id = ?`,
        [id, schoolId]
      );
    } else {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Invalid record type.' });
    }

    await connection.commit();
    res.json({ success: true, message: `${type} restored successfully.` });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// PUT /api/users/students/:id (Super Admin - Update Student Details)
const updateStudent = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const schoolId = req.user.school_id;
    const studentId = req.params.id; // students.id
    const { full_name, email, class_id, admission_no, avatar_url } = req.body;

    if (!full_name || !email || !class_id || !admission_no) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, class_id, and admission_no are required.'
      });
    }

    await connection.beginTransaction();

    const [stuRows] = await connection.query(
      `SELECT user_id FROM students WHERE id = ? AND school_id = ? AND deleted_at IS NULL`,
      [studentId, schoolId]
    );

    if (stuRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    const userId = stuRows[0].user_id;

    // Update users table
    await connection.query(
      `UPDATE users
       SET full_name = ?, email = ?, avatar_url = COALESCE(?, avatar_url)
       WHERE id = ? AND school_id = ? AND deleted_at IS NULL`,
      [full_name.trim(), email.trim().toLowerCase(), avatar_url || null, userId, schoolId]
    );

    // Update students table
    await connection.query(
      `UPDATE students
       SET class_id = ?, admission_no = ?
       WHERE id = ? AND school_id = ? AND deleted_at IS NULL`,
      [class_id, admission_no.trim(), studentId, schoolId]
    );

    await connection.commit();

    res.json({ success: true, message: 'Student profile updated successfully.' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

module.exports = {
  getTeachers,
  getStudents,
  createTeacher,
  updateTeacher,
  createStudent,
  updateStudent,
  deleteUser,
  getTrashRecords,
  restoreRecord
};
