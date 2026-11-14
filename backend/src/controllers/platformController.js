const pool = require('../config/db');

// GET /api/platform/settings (Public: Get Platform Branding, Settings & Schools Showcase)
const getPlatformSettings = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT setting_key, setting_value FROM platform_settings`
    );

    const settings = {
      platform_name: 'School Cloud Platform',
      platform_tagline: 'Enterprise Multi-Tenant SaaS Platform',
      platform_motto: 'Amni, Hufnaan & Horumar Waxbarasho',
      theme_color: '#2563eb',
      banner_announcement: 'Ku soo dhowow Nidaamka Guud ee Maamulka Dugsiyada ee Casriga ah.',
      contact_email: 'axmedjidhe12@gmail.com',
      contact_phone: '+252 61 5000000',
      logo_url: '',
      footer_text: '2026 School Cloud Platform. Xuquuqda oo dhan way dhowran tahay.'
    };

    rows.forEach((r) => {
      settings[r.setting_key] = r.setting_value;
    });

    // Also get active schools list for the public landing page showcase
    const [schools] = await pool.query(
      `SELECT s.id, s.school_name, s.motto, s.logo_url, s.phone, s.address, s.theme_color,
              (SELECT COUNT(*) FROM students st WHERE st.school_id = s.id AND st.deleted_at IS NULL) AS total_students,
              (SELECT COUNT(*) FROM users u WHERE u.school_id = s.id AND u.role = 'teacher' AND u.deleted_at IS NULL) AS total_teachers,
              (SELECT COUNT(*) FROM classes c WHERE c.school_id = s.id AND c.deleted_at IS NULL) AS total_classes
       FROM schools s
       WHERE s.deleted_at IS NULL
       ORDER BY s.id ASC`
    );

    // Get platform-wide summary metrics for landing page counters
    const [[metrics]] = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM schools WHERE deleted_at IS NULL) AS total_schools,
        (SELECT COUNT(*) FROM students WHERE deleted_at IS NULL) AS total_students,
        (SELECT COUNT(*) FROM users WHERE role = 'teacher' AND deleted_at IS NULL) AS total_teachers,
        (SELECT COUNT(*) FROM classes WHERE deleted_at IS NULL) AS total_classes,
        (SELECT COUNT(*) FROM email_logs WHERE status = 'sent') AS total_emails_sent`
    );

    res.json({
      success: true,
      settings,
      schools,
      metrics
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/platform/settings (Root Admin Only: Update Platform Branding & Design)
const updatePlatformSettings = async (req, res, next) => {
  try {
    const allowedKeys = [
      'platform_name',
      'platform_tagline',
      'platform_motto',
      'theme_color',
      'banner_announcement',
      'contact_email',
      'contact_phone',
      'logo_url',
      'footer_text'
    ];

    const updates = req.body;
    for (const key of Object.keys(updates)) {
      if (allowedKeys.includes(key)) {
        await pool.query(
          `INSERT INTO platform_settings (setting_key, setting_value)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
          [key, String(updates[key] ?? '')]
        );
      }
    }

    res.json({
      success: true,
      message: 'Naqshadda iyo habaynta nidaamka si guul leh ayaa loo cusbooneysiiyay.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlatformSettings,
  updatePlatformSettings
};
