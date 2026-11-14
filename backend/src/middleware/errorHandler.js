// Centralized Express Error Handling Middleware
const errorHandler = (err, req, res, next) => {
  // Structured logging of error
  console.error(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}:`, err.message);
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    console.error(err.stack);
  }

  // Handle MySQL Duplicate Entry (e.g. unique email or admission number)
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'A record with this identifier already exists in this school.'
    });
  }

  // Handle MySQL Foreign Key Constraint Failures
  if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'Database relationship constraint violation.'
    });
  }

  // Custom App Errors
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.',
    // Never expose stack trace in production
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {})
  });
};

// 404 Route Not Found Handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
