const pool = require('../config/db');
const { sendExamResultEmail } = require('../utils/emailService');

// GET /api/exams
const getExams = async (req, res, next) => {
  try {
    const schoolId = req.user.school_id;
    const { student_id, class_id, term } = req.query;

    let query = `
      SELECT e.id, e.school_id, e.student_id, e.subject, e.points, e.term, e.remarks,
             u.full_name AS student_name, u.email AS student_email,
             st.admission_no, c.class_name
      FROM exams_performance e
      JOIN students st ON st.id = e.student_id AND st.deleted_at IS NULL
      JOIN users u ON u.id = st.user_id AND u.deleted_at IS NULL
      JOIN classes c ON c.id = st.class_id AND c.deleted_at IS NULL
      WHERE e.school_id = ? AND e.deleted_at IS NULL
    `;
    const params = [schoolId];

    // If Student role, force query to their own student profile
    if (req.user.role === 'student') {
      if (!req.user.student_id) {
        return res.status(404).json({ success: false, message: 'Student profile not linked to user.' });
      }
      query += ` AND e.student_id = ?`;
      params.push(req.user.student_id);
    } else {
      if (student_id) {
        query += ` AND e.student_id = ?`;
        params.push(student_id);
      }
      if (class_id) {
        query += ` AND st.class_id = ?`;
        params.push(class_id);
      }
    }

    if (term) {
      query += ` AND e.term = ?`;
      params.push(term);
    }

    query += ` ORDER BY e.id DESC`;

    const [exams] = await pool.query(query, params);
    res.json({ success: true, exams });
  } catch (error) {
    next(error);
  }
};

// POST /api/exams (Teachers & Super Admin)
const recordExam = async (req, res, next) => {
  try {
    const schoolId = req.user.school_id;
    const { student_id, subject, points, term, remarks, notify_student } = req.body;

    if (!student_id || !subject || points === undefined || !term) {
      return res.status(400).json({
        success: false,
        message: 'student_id, subject, points, and term are required.'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO exams_performance (school_id, student_id, subject, points, term, remarks)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [schoolId, student_id, subject.trim(), Number(points), term.trim(), remarks ? remarks.trim() : null]
    );

    // Automated SendGrid Email Notification
    if (notify_student) {
      const [students] = await pool.query(
        `SELECT u.full_name, u.email
         FROM students st
         JOIN users u ON u.id = st.user_id
         WHERE st.id = ? AND st.school_id = ?`,
        [student_id, schoolId]
      );

      if (students.length > 0) {
        await sendExamResultEmail({
          school_id: schoolId,
          to: students[0].email,
          studentName: students[0].full_name,
          subjectName: subject.trim(),
          points: Number(points),
          term: term.trim(),
          remarks: remarks || ''
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Exam score recorded successfully.',
      examId: result.insertId
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/exams/:id (Teachers & Super Admin)
const updateExam = async (req, res, next) => {
  try {
    const schoolId = req.user.school_id;
    const examId = req.params.id;
    const { subject, points, term, remarks } = req.body;

    const [result] = await pool.query(
      `UPDATE exams_performance
       SET subject = ?, points = ?, term = ?, remarks = ?
       WHERE id = ? AND school_id = ? AND deleted_at IS NULL`,
      [subject.trim(), Number(points), term.trim(), remarks ? remarks.trim() : null, examId, schoolId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Exam record not found.' });
    }

    res.json({ success: true, message: 'Exam score updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/exams/:id (Teachers & Super Admin - Soft Delete)
const deleteExam = async (req, res, next) => {
  try {
    const schoolId = req.user.school_id;
    const examId = req.params.id;

    const [result] = await pool.query(
      `UPDATE exams_performance
       SET deleted_at = NOW()
       WHERE id = ? AND school_id = ? AND deleted_at IS NULL`,
      [examId, schoolId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Exam record not found.' });
    }

    res.json({ success: true, message: 'Exam record soft-deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExams,
  recordExam,
  updateExam,
  deleteExam
};
