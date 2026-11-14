const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Retrieve user and tenant school
    const [users] = await pool.query(
      `SELECT u.id, u.school_id, u.full_name, u.email, u.password_hash, u.role,
              u.avatar_url, u.subject, u.assigned_classes,
              s.school_name, s.phone AS school_phone, s.logo_url AS school_logo,
              s.theme_color AS school_theme_color, s.motto AS school_motto,
              st.id AS student_id, st.class_id, st.admission_no,
              c.class_name
       FROM users u
       JOIN schools s ON s.id = u.school_id
       LEFT JOIN students st ON st.user_id = u.id AND st.deleted_at IS NULL
       LEFT JOIN classes c ON c.id = st.class_id AND c.deleted_at IS NULL
       WHERE u.email = ? AND u.deleted_at IS NULL AND s.deleted_at IS NULL`,
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = users[0];

    // Verify Password Hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Generate JWT
    const payload = {
      id: user.id,
      school_id: user.school_id,
      role: user.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        school_id: user.school_id,
        school_name: user.school_name,
        school_logo: user.school_logo || null,
        school_theme_color: user.school_theme_color || '#2563eb',
        school_motto: user.school_motto || 'Excellence in Education',
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url || null,
        subject: user.subject || null,
        assigned_classes: user.assigned_classes || null,
        student_id: user.student_id || null,
        class_id: user.class_id || null,
        class_name: user.class_name || null,
        admission_no: user.admission_no || null
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/profile
const getProfile = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.school_id, u.full_name, u.email, u.role,
              u.avatar_url, u.subject, u.assigned_classes,
              s.school_name, s.logo_url AS school_logo,
              s.theme_color AS school_theme_color, s.motto AS school_motto,
              st.id AS student_id, st.class_id, st.admission_no,
              c.class_name
       FROM users u
       JOIN schools s ON s.id = u.school_id
       LEFT JOIN students st ON st.user_id = u.id AND st.deleted_at IS NULL
       LEFT JOIN classes c ON c.id = st.class_id AND c.deleted_at IS NULL
       WHERE u.id = ? AND u.deleted_at IS NULL`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      user: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getProfile
};
