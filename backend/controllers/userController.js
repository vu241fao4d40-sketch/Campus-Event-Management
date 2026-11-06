const { pool } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

// GET /api/users (Admin only)
const getAllUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;

    let whereClauses = [];
    let queryParams = [];

    if (role) {
      whereClauses.push('u.role = ?');
      queryParams.push(role);
    }

    if (search && search.trim()) {
      whereClauses.push('(u.name LIKE ? OR u.email LIKE ?)');
      const term = `%${search.trim()}%`;
      queryParams.push(term, term);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const query = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        DATE_FORMAT(u.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
        c.id AS managed_club_id,
        c.club_name AS managed_club_name
      FROM users u
      LEFT JOIN clubs c ON u.id = c.coordinator_id
      ${whereSql}
      ORDER BY u.created_at DESC
    `;

    const [users] = await pool.query(query, queryParams);
    return sendSuccess(res, 'Users fetched successfully.', users);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/:id/role (Admin only)
const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['admin', 'coordinator', 'student'];
    if (!role || !validRoles.includes(role)) {
      return sendError(res, `Invalid role. Must be one of: ${validRoles.join(', ')}`, 400);
    }

    // Prevent admin from demoting themselves if they are the current logged in user
    if (Number(id) === req.user.id && role !== 'admin') {
      return sendError(res, 'You cannot demote your own administrator account.', 400);
    }

    const [result] = await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);

    if (result.affectedRows === 0) {
      return sendError(res, 'User not found.', 404);
    }

    return sendSuccess(res, `User role updated to '${role}'.`, { id: Number(id), role });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  updateUserRole
};
