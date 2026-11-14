const pool = require('../config/db');
const { sendEmail } = require('../utils/emailService');

// GET /api/reports/dashboard-stats (Super Admin)
const getDashboardStats = async (req, res, next) => {
  try {
    const schoolId = req.user.school_id;

    // Counts
    const [[{ total_students }]] = await pool.query(
      `SELECT COUNT(*) AS total_students FROM students WHERE school_id = ? AND deleted_at IS NULL`,
      [schoolId]
    );

    const [[{ total_teachers }]] = await pool.query(
      `SELECT COUNT(*) AS total_teachers FROM users WHERE school_id = ? AND role = 'teacher' AND deleted_at IS NULL`,
      [schoolId]
    );

    const [[{ total_classes }]] = await pool.query(
      `SELECT COUNT(*) AS total_classes FROM classes WHERE school_id = ? AND deleted_at IS NULL`,
      [schoolId]
    );

    // Financials
    const [[financials]] = await pool.query(
      `SELECT
         COALESCE(SUM(amount_due), 0) AS total_billed,
         COALESCE(SUM(amount_paid), 0) AS total_collected,
         COALESCE(SUM(amount_due - amount_paid), 0) AS total_outstanding
       FROM fees
       WHERE school_id = ? AND deleted_at IS NULL`,
      [schoolId]
    );

    // Today's Attendance
    const today = new Date().toISOString().split('T')[0];
    const [[todayAttendance]] = await pool.query(
      `SELECT
         COUNT(CASE WHEN status = 'present' THEN 1 END) AS present_count,
         COUNT(CASE WHEN status = 'absent' THEN 1 END) AS absent_count,
         COUNT(CASE WHEN status = 'late' THEN 1 END) AS late_count
       FROM attendance
       WHERE school_id = ? AND date = ? AND deleted_at IS NULL`,
      [schoolId, today]
    );

    res.json({
      success: true,
      stats: {
        total_students,
        total_teachers,
        total_classes,
        financials,
        today_attendance: todayAttendance,
        date: today
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/email-logs (Super Admin - Email Audit Trail)
const getEmailAuditLogs = async (req, res, next) => {
  try {
    const isRoot = req.user.role === 'root_admin';
    const { school_id, event_type, status } = req.query;

    let query = `
      SELECT l.id, l.school_id, COALESCE(s.school_name, 'Unknown School') AS school_name,
             l.recipient_email, l.subject, l.event_type, l.status, l.sent_at
      FROM email_logs l
      LEFT JOIN schools s ON s.id = l.school_id
      WHERE 1=1
    `;
    const params = [];

    if (isRoot) {
      if (school_id && school_id !== 'all') {
        query += ` AND l.school_id = ?`;
        params.push(school_id);
      }
    } else {
      // Non-root principal is strictly isolated to their own school
      query += ` AND l.school_id = ?`;
      params.push(req.user.school_id);
    }

    if (event_type) {
      query += ` AND l.event_type = ?`;
      params.push(event_type);
    }

    if (status) {
      query += ` AND l.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY l.sent_at DESC LIMIT 150`;

    const [logs] = await pool.query(query, params);
    res.json({ success: true, logs });
  } catch (error) {
    next(error);
  }
};

// POST /api/reports/send-school-email (Master Admin: Dispatch Notice to Schools)
const sendSchoolOfficialEmail = async (req, res, next) => {
  try {
    const { target_school_id, subject, message } = req.body;

    if (!target_school_id || !subject || !message) {
      return res.status(400).json({ success: false, message: 'target_school_id, subject, and message are required.' });
    }

    // Determine target school(s)
    let targetSchools = [];
    if (target_school_id === 'all') {
      const [rows] = await pool.query(`
        SELECT s.id, s.school_name,
               (SELECT email FROM users WHERE school_id = s.id AND role IN ('super_admin', 'root_admin') AND deleted_at IS NULL LIMIT 1) AS admin_email
        FROM schools s
        WHERE s.deleted_at IS NULL
      `);
      targetSchools = rows;
    } else {
      const [rows] = await pool.query(`
        SELECT s.id, s.school_name,
               (SELECT email FROM users WHERE school_id = s.id AND role IN ('super_admin', 'root_admin') AND deleted_at IS NULL LIMIT 1) AS admin_email
        FROM schools s
        WHERE s.id = ? AND s.deleted_at IS NULL
      `, [target_school_id]);

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'School not found.' });
      }
      targetSchools = rows;
    }

    let dispatchedCount = 0;
    for (const sc of targetSchools) {
      const recipient = sc.admin_email || 'admin@greenwood.edu';
      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #0284c7; border-radius: 8px; padding: 24px;">
          <div style="background: #0284c7; color: #ffffff; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 18px;">Ogeysiis Rasmi ah oo ku socda: ${sc.school_name}</h2>
          </div>
          <p>Ku: Maamulka Dugsiga <strong>${sc.school_name}</strong>,</p>
          <div style="background: #f0f9ff; border-left: 4px solid #0284c7; padding: 16px; margin: 16px 0;">
            <p style="margin: 0;">${message.replace(/\n/g, '<br/>')}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="font-size: 12px; color: #777;">Sent via Platform Master Administration • Official School Dispatch</p>
        </div>
      `;

      await sendEmail({
        school_id: sc.id,
        to: recipient,
        subject: `[Official School Notice] ${subject.trim()}`,
        html,
        eventType: 'school_official_notice'
      });
      dispatchedCount++;
    }

    res.json({
      success: true,
      message: `Farriinta rasmiga ah waxaa loo diray ${dispatchedCount} dugsi.`
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/reports/send-custom-email (Super Admin)
const sendCustomEmail = async (req, res, next) => {
  try {
    const schoolId = req.user.school_id;
    const { recipient_email, subject, message } = req.body;

    if (!recipient_email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'recipient_email, subject, and message are required.' });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;">
        <h2 style="color: #1a56db; margin-top: 0;">School Announcement</h2>
        <p>${message.replace(/\n/g, '<br/>')}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="font-size: 12px; color: #777;">Sent via Multi-Tenant School Management Notification System</p>
      </div>
    `;

    const result = await sendEmail({
      school_id: schoolId,
      to: recipient_email.trim(),
      subject: subject.trim(),
      html,
      eventType: 'custom_announcement'
    });

    res.json({
      success: result.success,
      message: result.success
        ? 'Email dispatched and delivered successfully.'
        : `Email status: ${result.message || 'Failed to deliver'}. Please check your email credentials in backend/.env`,
      status: result.status
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/maintenance (Super Admin: System Health & Maintenance Info)
const getMaintenanceStatus = async (req, res, next) => {
  try {
    // 1. Table stats
    const [tables] = await pool.query(`
      SELECT table_name AS name, table_rows AS row_count,
             ROUND((data_length + index_length) / 1024, 2) AS size_kb
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      ORDER BY table_name ASC
    `);

    // 2. MySQL Version & Uptime
    const [[{ version }]] = await pool.query('SELECT VERSION() AS version');
    const [[{ uptime_seconds }]] = await pool.query("SHOW GLOBAL STATUS LIKE 'Uptime'").then(([rows]) => [[{ uptime_seconds: rows[0]?.Value || 0 }]]);

    // 3. Email Config
    const emailConfig = {
      smtp_configured: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
      smtp_user: process.env.SMTP_USER || null,
      sendgrid_configured: Boolean(process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.startsWith('SG.'))
    };

    // 4. Memory & Platform
    const memUsage = process.memoryUsage();

    res.json({
      success: true,
      maintenance: {
        status: 'Operational',
        database: {
          name: 'school_management_db',
          version,
          uptime_hours: (Number(uptime_seconds) / 3600).toFixed(1),
          tables
        },
        email: emailConfig,
        server: {
          node_version: process.version,
          memory_mb: (memUsage.heapUsed / 1024 / 1024).toFixed(2),
          uptime_hours: (process.uptime() / 3600).toFixed(2)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/reports/maintenance/optimize (Super Admin: Optimize & Health Check)
const optimizeDatabase = async (req, res, next) => {
  try {
    await pool.query('CHECK TABLE schools, users, classes, students, attendance, exams_performance, fees, email_logs');
    await pool.query('OPTIMIZE TABLE schools, users, classes, students, attendance, exams_performance, fees, email_logs');

    res.json({
      success: true,
      message: 'Dhammaan tables-ka xog-kaydka (MySQL) si guul leh ayaa loo nadiifiyay loona dayactiray.'
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/platform-overview (Master / Root Admin Overview)
const getPlatformOverview = async (req, res, next) => {
  try {
    const [[{ total_schools }]] = await pool.query(
      `SELECT COUNT(*) AS total_schools FROM schools WHERE deleted_at IS NULL`
    );
    const [[{ total_students }]] = await pool.query(
      `SELECT COUNT(*) AS total_students FROM students WHERE deleted_at IS NULL`
    );
    const [[{ total_teachers }]] = await pool.query(
      `SELECT COUNT(*) AS total_teachers FROM users WHERE role = 'teacher' AND deleted_at IS NULL`
    );
    const [[{ total_classes }]] = await pool.query(
      `SELECT COUNT(*) AS total_classes FROM classes WHERE deleted_at IS NULL`
    );
    const [[{ total_volume }]] = await pool.query(
      `SELECT COALESCE(SUM(amount_paid), 0) AS total_volume FROM fees WHERE deleted_at IS NULL`
    );

    res.json({
      success: true,
      overview: {
        total_schools,
        total_students,
        total_teachers,
        total_classes,
        total_volume
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getEmailAuditLogs,
  sendCustomEmail,
  sendSchoolOfficialEmail,
  getMaintenanceStatus,
  optimizeDatabase,
  getPlatformOverview
};
