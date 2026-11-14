const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Verify JWT and populate req.user with tenant context
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

    // Verify user exists and is active (soft-delete check)
    const [rows] = await pool.query(
      `SELECT u.id, u.school_id, u.full_name, u.email, u.role, s.school_name,
              st.id AS student_id, st.class_id, st.admission_no
       FROM users u
       JOIN schools s ON s.id = u.school_id
       LEFT JOIN students st ON st.user_id = u.id AND st.deleted_at IS NULL
       WHERE u.id = ? AND u.deleted_at IS NULL AND s.deleted_at IS NULL`,
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User not found or account deactivated.' });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
  }
};

// Role-Based Access Control (RBAC) middleware
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }
    // root_admin has master administrative access across the platform
    if (req.user.role === 'root_admin' || allowedRoles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: `Forbidden: Access requires one of the following roles: [${allowedRoles.join(', ')}]`
    });
  };
};

module.exports = {
  verifyToken,
  requireRole
};
