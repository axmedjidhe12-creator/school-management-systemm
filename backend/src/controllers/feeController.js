const pool = require('../config/db');
const { sendFeeReceiptEmail } = require('../utils/emailService');

// GET /api/fees
const getFees = async (req, res, next) => {
  try {
    const schoolId = req.user.school_id;
    const { status, student_id } = req.query;

    let query = `
      SELECT f.id, f.school_id, f.student_id, f.amount_due, f.amount_paid,
             (f.amount_due - f.amount_paid) AS balance,
             f.status, f.due_date,
             u.full_name AS student_name, u.email AS student_email,
             st.admission_no, c.class_name
      FROM fees f
      JOIN students st ON st.id = f.student_id AND st.deleted_at IS NULL
      JOIN users u ON u.id = st.user_id AND u.deleted_at IS NULL
      JOIN classes c ON c.id = st.class_id AND c.deleted_at IS NULL
      WHERE f.school_id = ? AND f.deleted_at IS NULL
    `;
    const params = [schoolId];

    if (req.user.role === 'student') {
      if (!req.user.student_id) {
        return res.status(404).json({ success: false, message: 'Student profile not linked to user.' });
      }
      query += ` AND f.student_id = ?`;
      params.push(req.user.student_id);
    } else {
      if (student_id) {
        query += ` AND f.student_id = ?`;
        params.push(student_id);
      }
      if (status) {
        query += ` AND f.status = ?`;
        params.push(status);
      }
    }

    query += ` ORDER BY f.due_date ASC`;

    const [fees] = await pool.query(query, params);

    // Summary calculation for Super Admin
    let summary = null;
    if (req.user.role === 'super_admin') {
      const [sumRows] = await pool.query(
        `SELECT
           SUM(amount_due) AS total_billed,
           SUM(amount_paid) AS total_collected,
           SUM(amount_due - amount_paid) AS total_outstanding,
           COUNT(CASE WHEN status = 'paid' THEN 1 END) AS count_paid,
           COUNT(CASE WHEN status = 'partial' THEN 1 END) AS count_partial,
           COUNT(CASE WHEN status = 'unpaid' THEN 1 END) AS count_unpaid
         FROM fees
         WHERE school_id = ? AND deleted_at IS NULL`,
        [schoolId]
      );
      summary = sumRows[0];
    }

    res.json({ success: true, fees, summary });
  } catch (error) {
    next(error);
  }
};

// POST /api/fees/:id/pay (Super Admin - Record Payment)
const recordFeePayment = async (req, res, next) => {
  try {
    const schoolId = req.user.school_id;
    const feeId = req.params.id;
    const { payment_amount, notify_student } = req.body;

    if (!payment_amount || Number(payment_amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid positive payment_amount is required.' });
    }

    const [feeRecords] = await pool.query(
      `SELECT f.*, u.full_name AS student_name, u.email AS student_email
       FROM fees f
       JOIN students st ON st.id = f.student_id
       JOIN users u ON u.id = st.user_id
       WHERE f.id = ? AND f.school_id = ? AND f.deleted_at IS NULL`,
      [feeId, schoolId]
    );

    if (feeRecords.length === 0) {
      return res.status(404).json({ success: false, message: 'Fee record not found.' });
    }

    const fee = feeRecords[0];
    const newPaid = Number(fee.amount_paid) + Number(payment_amount);
    const amountDue = Number(fee.amount_due);
    const newBalance = Math.max(0, amountDue - newPaid);

    let newStatus = 'unpaid';
    if (newPaid >= amountDue) {
      newStatus = 'paid';
    } else if (newPaid > 0) {
      newStatus = 'partial';
    }

    await pool.query(
      `UPDATE fees
       SET amount_paid = ?, status = ?
       WHERE id = ? AND school_id = ?`,
      [newPaid, newStatus, feeId, schoolId]
    );

    // Send automated email receipt if requested
    if (notify_student) {
      await sendFeeReceiptEmail({
        school_id: schoolId,
        to: fee.student_email,
        studentName: fee.student_name,
        amountPaid: newPaid,
        amountDue,
        balance: newBalance,
        status: newStatus
      });
    }

    res.json({
      success: true,
      message: 'Payment recorded successfully.',
      fee: {
        id: feeId,
        amount_due: amountDue,
        amount_paid: newPaid,
        balance: newBalance,
        status: newStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFees,
  recordFeePayment
};
