const rateLimit = require('express-rate-limit');

// General API Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

// Stricter Rate Limiter for Login/Authentication
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15, // limit each IP to 15 login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts, please try again in 10 minutes.'
  }
});

// Stricter Rate Limiter for outbound email triggers (SendGrid Protection)
const emailLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // limit manual email triggers
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Email dispatch rate limit exceeded. Please wait before sending more notifications.'
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  emailLimiter
};
