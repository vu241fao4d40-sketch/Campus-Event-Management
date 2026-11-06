const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { sendError } = require('../utils/response');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return sendError(res, 'Authentication token missing.', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists in the database
    const [rows] = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0) {
      return sendError(res, 'User account no longer exists.', 401);
    }

    req.user = rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Session expired. Please log in again.', 401);
    }
    return sendError(res, 'Invalid authentication token.', 401);
  }
};

// Optional auth: attaches req.user if a valid token is present, but doesn't block if not
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [rows] = await pool.query(
          'SELECT id, name, email, role FROM users WHERE id = ?',
          [decoded.id]
        );
        if (rows.length > 0) {
          req.user = rows[0];
        }
      }
    }
  } catch (err) {
    // Ignore invalid token in optionalAuth
    req.user = null;
  }
  next();
};

module.exports = {
  verifyToken,
  optionalAuth
};
