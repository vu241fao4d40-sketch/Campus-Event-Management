const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 'Name, email, and password are required.', 400);
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return sendError(res, 'Please provide a valid email address.', 400);
    }

    if (password.length < 6) {
      return sendError(res, 'Password must be at least 6 characters long.', 400);
    }

    // Check if user already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [trimmedEmail]);
    if (existing.length > 0) {
      return sendError(res, 'An account with this email already exists.', 409);
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Default role is 'student'
    const role = 'student';

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name.trim(), trimmedEmail, passwordHash, role]
    );

    const newUser = {
      id: result.insertId,
      name: name.trim(),
      email: trimmedEmail,
      role
    };

    const token = generateToken(newUser);

    return sendSuccess(
      res,
      'Registration successful!',
      {
        user: newUser,
        token
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required.', 400);
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Query user by email
    const [users] = await pool.query(
      'SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = ?',
      [trimmedEmail]
    );

    if (users.length === 0) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    const user = users[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    // If user is a coordinator, check if they manage a club
    let managedClub = null;
    if (user.role === 'coordinator') {
      const [clubs] = await pool.query(
        'SELECT id, club_name, description FROM clubs WHERE coordinator_id = ?',
        [user.id]
      );
      if (clubs.length > 0) {
        managedClub = clubs[0];
      }
    }

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      managedClub,
      created_at: user.created_at
    };

    const token = generateToken(userResponse);

    return sendSuccess(res, 'Login successful!', {
      user: userResponse,
      token
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
const getCurrentUser = async (req, res, next) => {
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return sendError(res, 'User not found.', 404);
    }

    const user = users[0];

    // If coordinator, fetch their club
    let managedClub = null;
    if (user.role === 'coordinator') {
      const [clubs] = await pool.query(
        'SELECT id, club_name, description FROM clubs WHERE coordinator_id = ?',
        [user.id]
      );
      if (clubs.length > 0) {
        managedClub = clubs[0];
      }
    }

    return sendSuccess(res, 'User profile fetched successfully.', {
      ...user,
      managedClub
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!name && !newPassword) {
      return sendError(res, 'Nothing to update.', 400);
    }

    if (name) {
      await pool.query('UPDATE users SET name = ? WHERE id = ?', [name.trim(), userId]);
    }

    if (newPassword) {
      if (!currentPassword) {
        return sendError(res, 'Current password is required to change password.', 400);
      }
      if (newPassword.length < 6) {
        return sendError(res, 'New password must be at least 6 characters long.', 400);
      }

      const [users] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
      const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
      if (!isMatch) {
        return sendError(res, 'Current password is incorrect.', 400);
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);
    }

    const [updatedUsers] = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [userId]
    );

    return sendSuccess(res, 'Profile updated successfully!', updatedUsers[0]);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  updateProfile
};
