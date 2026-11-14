const pool = require('../config/db');
const { sendAbsenceAlertEmail } = require('../utils/emailService');

// GET /api/attendance
const getAttendance = async (req, res, next) => {
  try {
    const schoolId = req.user.school_id;
    const { student_id, class_id, date, status } = req.query;

    let query = `
      SELECT a.id, a.school_id, a.student_id, a.date, a.status,
             u.full_name AS student_name, u.email AS student_email,
             st.admission_no, c.class_name
      FROM attendance a
      JOIN students st ON st.id = a.student_id AND st.deleted_at IS NULL
      JOIN users u ON u.id = st.user_id AND u.deleted_at IS NULL
      JOIN classes c ON c.id = st.class_id AND c.deleted_at IS NULL
      WHERE a.school_id = ? AND a.deleted_at IS NULL
    `;
    const params = [schoolId];

    if (req.user.role === 'student') {
      if (!req.user.student_id) {
        return res.status(404).json({ success: false, message: 'Student profile not linked to user.' });
      }
      query += ` AND a.student_id = ?`;
      params.push(req.user.student_id);
    } else {
      if (student_id) {
        query += ` AND a.student_id = ?`;
        params.push(student_id);
      }
      if (class_id) {
        query += ` AND st.class_id = ?`;
        params.push(class_id);
      }
    }

    if (date) {
      query += ` AND a.date = ?`;
      params.push(date);
    }

    if (status) {
      query += ` AND a.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY a.date DESC, u.full_name ASC`;

    const [attendance] = await pool.query(query, params);
    res.json({ success: true, attendance });
  } catch (error) {
    next(error);
  }
};

// POST /api/attendance/batch (Teachers & Super Admin - Record Daily Attendance)
const recordBatchAttendance = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const schoolId = req.user.school_id;
    const { date, records } = req.body; // records: [{ student_id, status: 'present'|'absent'|'late' }]

    if (!date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'date and records array are required.' });
    }

    await connection.beginTransaction();

    const absentStudentsToAlert = [];

    for (const item of records) {
      const { student_id, status } = item;
      if (!['present', 'absent', 'late'].includes(status)) continue;

      await connection.query(
        `INSERT INTO attendance (school_id, student_id, date, status)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status), deleted_at = NULL`,
        [schoolId, student_id, date, status]
      );

      if (status === 'absent') {
        absentStudentsToAlert.push(student_id);
      }
    }

    await connection.commit();

    // Trigger Automated SendGrid Absence Alerts asynchronously
    if (absentStudentsToAlert.length > 0) {
      const [absentUsers] = await pool.query(
        `SELECT u.full_name, u.email
         FROM students st
         JOIN users u ON u.id = st.user_id
         WHERE st.id IN (?) AND st.school_id = ?`,
        [absentStudentsToAlert, schoolId]
      );

      for (const student of absentUsers) {
        sendAbsenceAlertEmail({
          school_id: schoolId,
          to: student.email,
          studentName: student.full_name,
          date
        }).catch(err => console.error('Absence email error:', err.message));
      }
    }

    res.json({
      success: true,
      message: `Recorded attendance for ${records.length} students on ${date}. Automated absence alerts triggered for ${absentStudentsToAlert.length} students.`
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

module.exports = {
  getAttendance,
  recordBatchAttendance
};
