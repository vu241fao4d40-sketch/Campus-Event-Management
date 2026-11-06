const { pool } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

// GET /api/clubs
const getAllClubs = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;

    const query = `
      SELECT 
        c.id, 
        c.club_name, 
        c.description, 
        c.coordinator_id,
        c.created_at,
        u.name AS coordinator_name,
        u.email AS coordinator_email,
        COUNT(DISTINCT cm.id) AS member_count,
        COUNT(DISTINCT e.id) AS event_count,
        ${userId ? `EXISTS(SELECT 1 FROM club_members cm2 WHERE cm2.club_id = c.id AND cm2.user_id = ${mysqlEscapeNumber(userId)})` : '0'} AS is_member
      FROM clubs c
      LEFT JOIN users u ON c.coordinator_id = u.id
      LEFT JOIN club_members cm ON c.id = cm.club_id
      LEFT JOIN events e ON c.id = e.club_id
      GROUP BY c.id
      ORDER BY c.club_name ASC
    `;

    const [clubs] = await pool.query(query);
    return sendSuccess(res, 'Clubs fetched successfully.', clubs);
  } catch (error) {
    next(error);
  }
};

// Helper for safe integer injection in subquery
function mysqlEscapeNumber(val) {
  const num = Number(val);
  return isNaN(num) ? 0 : num;
}

// GET /api/clubs/:id
const getClubById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;

    const [clubs] = await pool.query(
      `SELECT 
        c.id, 
        c.club_name, 
        c.description, 
        c.coordinator_id, 
        c.created_at,
        u.name AS coordinator_name,
        u.email AS coordinator_email,
        COUNT(DISTINCT cm.id) AS member_count
      FROM clubs c
      LEFT JOIN users u ON c.coordinator_id = u.id
      LEFT JOIN club_members cm ON c.id = cm.club_id
      WHERE c.id = ?
      GROUP BY c.id`,
      [id]
    );

    if (clubs.length === 0) {
      return sendError(res, 'Club not found.', 404);
    }

    const club = clubs[0];

    // Check membership
    let isMember = false;
    if (userId) {
      const [memberships] = await pool.query(
        'SELECT id FROM club_members WHERE club_id = ? AND user_id = ?',
        [id, userId]
      );
      isMember = memberships.length > 0;
    }

    // Fetch club events (published or all if coordinator/admin)
    const isOwnerOrAdmin = req.user && (req.user.role === 'admin' || req.user.id === club.coordinator_id);
    const eventStatusCondition = isOwnerOrAdmin ? '' : "AND e.status = 'published'";

    const [events] = await pool.query(
      `SELECT 
        e.id, e.title, e.description, e.venue, e.event_date, e.start_time, e.end_time,
        e.registration_deadline, e.max_participants, e.status,
        ec.category_name,
        COUNT(er.id) AS registered_count
      FROM events e
      JOIN event_categories ec ON e.category_id = ec.id
      LEFT JOIN event_registrations er ON e.id = er.event_id AND er.registration_status = 'registered'
      WHERE e.club_id = ? ${eventStatusCondition}
      GROUP BY e.id
      ORDER BY e.event_date ASC, e.start_time ASC`,
      [id]
    );

    return sendSuccess(res, 'Club details fetched successfully.', {
      ...club,
      isMember: Boolean(isMember),
      events
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/clubs (Admin only)
const createClub = async (req, res, next) => {
  try {
    const { club_name, description, coordinator_id } = req.body;

    if (!club_name || !club_name.trim()) {
      return sendError(res, 'Club name is required.', 400);
    }

    // Check duplicate
    const [existing] = await pool.query('SELECT id FROM clubs WHERE club_name = ?', [club_name.trim()]);
    if (existing.length > 0) {
      return sendError(res, 'A club with this name already exists.', 409);
    }

    let validCoordinatorId = null;
    if (coordinator_id) {
      const [coord] = await pool.query('SELECT id, role FROM users WHERE id = ?', [coordinator_id]);
      if (coord.length === 0) {
        return sendError(res, 'Coordinator user not found.', 404);
      }
      validCoordinatorId = coordinator_id;
    }

    const [result] = await pool.query(
      'INSERT INTO clubs (club_name, description, coordinator_id) VALUES (?, ?, ?)',
      [club_name.trim(), description ? description.trim() : null, validCoordinatorId]
    );

    return sendSuccess(
      res,
      'Club created successfully!',
      {
        id: result.insertId,
        club_name: club_name.trim(),
        description: description ? description.trim() : null,
        coordinator_id: validCoordinatorId
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// PUT /api/clubs/:id (Admin or assigned Coordinator)
const updateClub = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { club_name, description, coordinator_id } = req.body;

    const [clubs] = await pool.query('SELECT * FROM clubs WHERE id = ?', [id]);
    if (clubs.length === 0) {
      return sendError(res, 'Club not found.', 404);
    }

    const currentClub = clubs[0];

    // Check authorization: Admin or assigned Coordinator
    if (req.user.role !== 'admin' && currentClub.coordinator_id !== req.user.id) {
      return sendError(res, 'You are not authorized to update this club.', 403);
    }

    // Check unique name if updating club_name
    const newName = club_name ? club_name.trim() : currentClub.club_name;
    const [dup] = await pool.query('SELECT id FROM clubs WHERE club_name = ? AND id != ?', [newName, id]);
    if (dup.length > 0) {
      return sendError(res, 'Another club with this name already exists.', 409);
    }

    // Only admin can reassign coordinator_id
    let newCoordId = currentClub.coordinator_id;
    if (req.user.role === 'admin' && coordinator_id !== undefined) {
      if (coordinator_id) {
        const [coord] = await pool.query('SELECT id FROM users WHERE id = ?', [coordinator_id]);
        if (coord.length === 0) {
          return sendError(res, 'Assigned coordinator user does not exist.', 404);
        }
        newCoordId = coordinator_id;
      } else {
        newCoordId = null;
      }
    }

    const newDesc = description !== undefined ? (description ? description.trim() : null) : currentClub.description;

    await pool.query(
      'UPDATE clubs SET club_name = ?, description = ?, coordinator_id = ? WHERE id = ?',
      [newName, newDesc, newCoordId, id]
    );

    return sendSuccess(res, 'Club updated successfully!', {
      id: Number(id),
      club_name: newName,
      description: newDesc,
      coordinator_id: newCoordId
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/clubs/:id (Admin only)
const deleteClub = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if events exist for this club
    const [events] = await pool.query('SELECT id FROM events WHERE club_id = ? LIMIT 1', [id]);
    if (events.length > 0) {
      return sendError(
        res,
        'Cannot delete club because events are associated with it. Please cancel or delete the events first.',
        400
      );
    }

    const [result] = await pool.query('DELETE FROM clubs WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return sendError(res, 'Club not found.', 404);
    }

    return sendSuccess(res, 'Club deleted successfully.');
  } catch (error) {
    next(error);
  }
};

// POST /api/clubs/:id/join (Student)
const joinClub = async (req, res, next) => {
  try {
    const clubId = req.params.id;
    const userId = req.user.id;

    // Check if club exists
    const [clubs] = await pool.query('SELECT id, club_name FROM clubs WHERE id = ?', [clubId]);
    if (clubs.length === 0) {
      return sendError(res, 'Club not found.', 404);
    }

    // Check already a member
    const [existing] = await pool.query(
      'SELECT id FROM club_members WHERE club_id = ? AND user_id = ?',
      [clubId, userId]
    );

    if (existing.length > 0) {
      return sendError(res, 'You are already a member of this club.', 400);
    }

    await pool.query(
      'INSERT INTO club_members (club_id, user_id) VALUES (?, ?)',
      [clubId, userId]
    );

    return sendSuccess(res, `Joined ${clubs[0].club_name} successfully!`);
  } catch (error) {
    next(error);
  }
};

// POST /api/clubs/:id/leave (Student)
const leaveClub = async (req, res, next) => {
  try {
    const clubId = req.params.id;
    const userId = req.user.id;

    const [result] = await pool.query(
      'DELETE FROM club_members WHERE club_id = ? AND user_id = ?',
      [clubId, userId]
    );

    if (result.affectedRows === 0) {
      return sendError(res, 'You are not a member of this club.', 400);
    }

    return sendSuccess(res, 'You have left the club successfully.');
  } catch (error) {
    next(error);
  }
};

// GET /api/clubs/:id/members (Coordinator or Admin)
const getClubMembers = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify club
    const [clubs] = await pool.query('SELECT coordinator_id FROM clubs WHERE id = ?', [id]);
    if (clubs.length === 0) {
      return sendError(res, 'Club not found.', 404);
    }

    if (req.user.role !== 'admin' && clubs[0].coordinator_id !== req.user.id) {
      return sendError(res, 'Not authorized to view member list.', 403);
    }

    const [members] = await pool.query(
      `SELECT cm.id, cm.joined_at, u.id AS user_id, u.name, u.email, u.role
       FROM club_members cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.club_id = ?
       ORDER BY cm.joined_at DESC`,
      [id]
    );

    return sendSuccess(res, 'Members fetched successfully.', members);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllClubs,
  getClubById,
  createClub,
  updateClub,
  deleteClub,
  joinClub,
  leaveClub,
  getClubMembers
};
