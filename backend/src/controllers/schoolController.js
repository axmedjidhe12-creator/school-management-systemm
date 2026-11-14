const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { sendSchoolProvisionedEmail } = require('../utils/emailService');

// GET /api/schools/current
const getCurrentSchool = async (req, res, next) => {
  try {
    const [schools] = await pool.query(
      `SELECT id, school_name, address, phone, logo_url, theme_color, motto, created_at
       FROM schools
       WHERE id = ? AND deleted_at IS NULL`,
      [req.user.school_id]
    );

    if (schools.length === 0) {
      return res.status(404).json({ success: false, message: 'School profile not found.' });
    }

    res.json({ success: true, school: schools[0] });
  } catch (error) {
    next(error);
  }
};

// PUT /api/schools/current (Super Admin Only)
const updateCurrentSchool = async (req, res, next) => {
  try {
    const { school_name, address, phone, logo_url, theme_color, motto } = req.body;

    if (!school_name) {
      return res.status(400).json({ success: false, message: 'School name is required.' });
    }

    await pool.query(
      `UPDATE schools
       SET school_name = ?,
           address = ?,
           phone = ?,
           logo_url = COALESCE(?, logo_url),
           theme_color = COALESCE(?, theme_color),
           motto = COALESCE(?, motto)
       WHERE id = ? AND deleted_at IS NULL`,
      [
        school_name.trim(),
        address || null,
        phone || null,
        logo_url !== undefined ? logo_url : null,
        theme_color || '#2563eb',
        motto || 'Excellence in Education',
        req.user.school_id
      ]
    );

    res.json({ success: true, message: 'School profile, design, and branding updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/schools (Super Admin: View all registered schools in the system)
const getAllSchools = async (req, res, next) => {
  try {
    const [schools] = await pool.query(
      `SELECT s.id, s.school_name, s.address, s.phone, s.logo_url, s.theme_color, s.motto, s.created_at,
              (SELECT COUNT(*) FROM students st WHERE st.school_id = s.id AND st.deleted_at IS NULL) AS total_students,
              (SELECT COUNT(*) FROM users u WHERE u.school_id = s.id AND u.role = 'teacher' AND u.deleted_at IS NULL) AS total_teachers,
              (SELECT COUNT(*) FROM classes c WHERE c.school_id = s.id AND c.deleted_at IS NULL) AS total_classes,
              (SELECT COALESCE(SUM(amount_paid), 0) FROM fees f WHERE f.school_id = s.id AND f.deleted_at IS NULL) AS total_collected
       FROM schools s
       WHERE s.deleted_at IS NULL
       ORDER BY s.id ASC`
    );

    res.json({ success: true, schools });
  } catch (error) {
    next(error);
  }
};

// POST /api/schools (Master Admin: Create a new school tenant + Auto-provision Principal & Classes)
const createSchool = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const {
      school_name,
      address,
      phone,
      logo_url,
      theme_color,
      motto,
      principal_name,
      principal_email,
      principal_password
    } = req.body;

    if (!school_name || !school_name.trim()) {
      return res.status(400).json({ success: false, message: 'Magaca dugsiga (School name) waa waajib.' });
    }

    const cleanSchoolName = school_name.trim();
    const cleanPrincipalName = (principal_name && principal_name.trim()) || `Principal (${cleanSchoolName})`;
    const slug = cleanSchoolName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanPrincipalEmail = (principal_email && principal_email.trim().toLowerCase()) || `admin@${slug || 'school'}.edu`;
    const cleanPassword = principal_password || 'Password123!';

    // Check if principal email already exists
    const [existingUsers] = await connection.query(
      `SELECT id FROM users WHERE email = ? AND deleted_at IS NULL`,
      [cleanPrincipalEmail]
    );
    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Email-ka ${cleanPrincipalEmail} horey ayaa loogu diiwaangeliyay nidaamka. Fadlan dooro email kale.`
      });
    }

    await connection.beginTransaction();

    // 1. Insert School
    const [schoolResult] = await connection.query(
      `INSERT INTO schools (school_name, address, phone, logo_url, theme_color, motto)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        cleanSchoolName,
        address || null,
        phone || null,
        logo_url || null,
        theme_color || '#2563eb',
        motto || 'Excellence in Education'
      ]
    );
    const newSchoolId = schoolResult.insertId;

    // 2. Hash password & Insert Principal (super_admin)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(cleanPassword, salt);

    const [userResult] = await connection.query(
      `INSERT INTO users (school_id, full_name, email, password_hash, role)
       VALUES (?, ?, ?, ?, 'super_admin')`,
      [newSchoolId, cleanPrincipalName, cleanPrincipalEmail, hashedPassword]
    );

    // 3. Create default starter classes
    await connection.query(
      `INSERT INTO classes (school_id, class_name) VALUES (?, ?), (?, ?)`,
      [newSchoolId, 'Fasalka 1-aad (Grade 10)', newSchoolId, 'Fasalka 2-aad (Grade 11)']
    );

    await connection.commit();

    // 4. Send Welcome & Provisioning Email to Principal
    let emailStatus = 'pending';
    try {
      const emailRes = await sendSchoolProvisionedEmail({
        school_id: newSchoolId,
        to: cleanPrincipalEmail,
        principalName: cleanPrincipalName,
        schoolName: cleanSchoolName,
        email: cleanPrincipalEmail,
        password: cleanPassword,
        loginUrl: 'http://localhost:3000/login'
      });
      emailStatus = emailRes.status;
    } catch (mailErr) {
      console.error('School welcome email dispatch failed:', mailErr.message);
      emailStatus = 'failed';
    }

    res.status(201).json({
      success: true,
      message: 'Dugsiga iyo Koontada Maamulaha (Principal) si buuxda ayaa loo diiwaangeliyay.',
      schoolId: newSchoolId,
      school: {
        id: newSchoolId,
        school_name: cleanSchoolName,
        phone,
        address,
        theme_color: theme_color || '#2563eb'
      },
      principal: {
        id: userResult.insertId,
        full_name: cleanPrincipalName,
        email: cleanPrincipalEmail,
        password: cleanPassword,
        role: 'super_admin',
        emailStatus
      }
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// PUT /api/schools/:id (Master Admin: Update Any School)
const updateSchoolById = async (req, res, next) => {
  try {
    const schoolId = req.params.id;
    const { school_name, address, phone, logo_url, theme_color, motto } = req.body;

    if (!school_name) {
      return res.status(400).json({ success: false, message: 'School name is required.' });
    }

    await pool.query(
      `UPDATE schools
       SET school_name = ?, address = ?, phone = ?, logo_url = COALESCE(?, logo_url),
           theme_color = COALESCE(?, theme_color), motto = COALESCE(?, motto)
       WHERE id = ? AND deleted_at IS NULL`,
      [
        school_name.trim(),
        address || null,
        phone || null,
        logo_url !== undefined ? logo_url : null,
        theme_color || '#2563eb',
        motto || 'Excellence in Education',
        schoolId
      ]
    );

    res.json({ success: true, message: 'School updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/schools/:id (Master Admin: Soft-delete School)
const deleteSchoolById = async (req, res, next) => {
  try {
    const schoolId = req.params.id;
    await pool.query(
      `UPDATE schools SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
      [schoolId]
    );
    res.json({ success: true, message: 'School soft-deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCurrentSchool,
  updateCurrentSchool,
  getAllSchools,
  createSchool,
  updateSchoolById,
  deleteSchoolById
};
