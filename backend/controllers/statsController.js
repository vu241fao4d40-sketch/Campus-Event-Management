const { pool } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

// GET /api/stats/overview (Admin)
const getAdminStats = async (req, res, next) => {
  try {
    // 1. Users count by role
    const [userStats] = await pool.query(`
      SELECT 
        COUNT(*) AS total_users,
        COUNT(CASE WHEN role = 'student' THEN 1 END) AS total_students,
        COUNT(CASE WHEN role = 'coordinator' THEN 1 END) AS total_coordinators,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) AS total_admins
      FROM users
    `);

    // 2. Clubs count
    const [clubStats] = await pool.query(`
      SELECT COUNT(*) AS total_clubs FROM clubs
    `);

    // 3. Events count by status
    const [eventStats] = await pool.query(`
      SELECT 
        COUNT(*) AS total_events,
        COUNT(CASE WHEN status = 'published' THEN 1 END) AS published_events,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) AS draft_events,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_events,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled_events
      FROM events
    `);

    // 4. Registrations count by status
    const [regStats] = await pool.query(`
      SELECT 
        COUNT(*) AS total_registrations,
        COUNT(CASE WHEN registration_status = 'registered' THEN 1 END) AS active_registrations,
        COUNT(CASE WHEN registration_status = 'attended' THEN 1 END) AS attended_registrations,
        COUNT(CASE WHEN registration_status = 'cancelled' THEN 1 END) AS cancelled_registrations
      FROM event_registrations
    `);

    // 5. Top 5 popular events
    const [topEvents] = await pool.query(`
      SELECT 
        e.id, 
        e.title, 
        e.max_participants, 
        DATE_FORMAT(e.event_date, '%Y-%m-%d') AS event_date,
        c.club_name,
        COUNT(er.id) AS registered_count
      FROM events e
      JOIN clubs c ON e.club_id = c.id
      LEFT JOIN event_registrations er ON e.id = er.event_id AND er.registration_status = 'registered'
      GROUP BY e.id
      ORDER BY registered_count DESC
      LIMIT 5
    `);

    return sendSuccess(res, 'Admin stats fetched successfully.', {
      users: userStats[0],
      clubs: clubStats[0],
      events: eventStats[0],
      registrations: regStats[0],
      topEvents
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/stats/coordinator (Coordinator)
const getCoordinatorStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get club managed by coordinator
    const [clubs] = await pool.query(
      'SELECT id, club_name, description FROM clubs WHERE coordinator_id = ?',
      [userId]
    );

    if (clubs.length === 0) {
      return sendSuccess(res, 'No assigned club for this coordinator.', {
        has_club: false
      });
    }

    const club = clubs[0];

    // Club member count
    const [members] = await pool.query(
      'SELECT COUNT(*) AS total_members FROM club_members WHERE club_id = ?',
      [club.id]
    );

    // Event stats for this club
    const [eventStats] = await pool.query(`
      SELECT 
        COUNT(*) AS total_events,
        COUNT(CASE WHEN status = 'published' THEN 1 END) AS published_events,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) AS draft_events,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_events,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled_events
      FROM events
      WHERE club_id = ?
    `, [club.id]);

    // Total registrations across club's events
    const [regStats] = await pool.query(`
      SELECT 
        COUNT(er.id) AS total_registrations,
        COUNT(CASE WHEN er.registration_status = 'registered' THEN 1 END) AS active_registrations,
        COUNT(CASE WHEN er.registration_status = 'attended' THEN 1 END) AS attended_registrations
      FROM events e
      JOIN event_registrations er ON e.id = er.event_id
      WHERE e.club_id = ?
    `, [club.id]);

    return sendSuccess(res, 'Coordinator stats fetched successfully.', {
      has_club: true,
      club,
      members: members[0].total_members,
      events: eventStats[0],
      registrations: regStats[0]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,
  getCoordinatorStats
};
