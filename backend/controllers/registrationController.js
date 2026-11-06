const { pool } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

// POST /api/events/:id/register (Student)
const registerForEvent = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    // Begin transaction for concurrency-safe registration
    await connection.beginTransaction();

    // Lock event row for update
    const [events] = await connection.query(
      `SELECT 
        id, 
        title, 
        max_participants, 
        status, 
        registration_deadline,
        (registration_deadline < NOW()) AS is_expired
       FROM events 
       WHERE id = ? 
       FOR UPDATE`,
      [eventId]
    );

    if (events.length === 0) {
      await connection.rollback();
      return sendError(res, 'Event not found.', 404);
    }

    const event = events[0];

    // Check status
    if (event.status !== 'published') {
      await connection.rollback();
      return sendError(res, `Cannot register for this event because it is currently '${event.status}'.`, 400);
    }

    // Check deadline
    if (event.is_expired) {
      await connection.rollback();
      return sendError(res, 'Registration closed. The deadline has already passed.', 400);
    }

    // Check current registered count
    const [counts] = await connection.query(
      "SELECT COUNT(*) AS active_regs FROM event_registrations WHERE event_id = ? AND registration_status = 'registered'",
      [eventId]
    );

    if (counts[0].active_regs >= event.max_participants) {
      await connection.rollback();
      return sendError(res, 'Event is full! Maximum participant capacity reached.', 400);
    }

    // Check existing registration
    const [existing] = await connection.query(
      'SELECT id, registration_status FROM event_registrations WHERE event_id = ? AND user_id = ?',
      [eventId, userId]
    );

    if (existing.length > 0) {
      if (existing[0].registration_status === 'registered') {
        await connection.rollback();
        return sendError(res, 'You are already registered for this event.', 400);
      } else {
        // Re-activate previously cancelled registration
        await connection.query(
          "UPDATE event_registrations SET registration_status = 'registered', registered_at = CURRENT_TIMESTAMP WHERE id = ?",
          [existing[0].id]
        );
        await connection.commit();
        return sendSuccess(res, `Successfully re-registered for "${event.title}"!`, {
          event_id: Number(eventId),
          registration_status: 'registered'
        });
      }
    }

    // Insert new registration
    await connection.query(
      "INSERT INTO event_registrations (event_id, user_id, registration_status) VALUES (?, ?, 'registered')",
      [eventId, userId]
    );

    await connection.commit();

    return sendSuccess(
      res,
      `Successfully registered for "${event.title}"!`,
      {
        event_id: Number(eventId),
        registration_status: 'registered'
      },
      201
    );
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// POST /api/events/:id/cancel (Student)
const cancelRegistration = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const [regs] = await pool.query(
      "SELECT id, registration_status FROM event_registrations WHERE event_id = ? AND user_id = ?",
      [eventId, userId]
    );

    if (regs.length === 0 || regs[0].registration_status !== 'registered') {
      return sendError(res, 'You do not have an active registration for this event.', 400);
    }

    await pool.query(
      "UPDATE event_registrations SET registration_status = 'cancelled' WHERE id = ?",
      [regs[0].id]
    );

    return sendSuccess(res, 'Event registration cancelled successfully.');
  } catch (error) {
    next(error);
  }
};

// GET /api/registrations/my (Student)
const getMyRegistrations = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT 
        er.id AS registration_id,
        er.registration_status,
        DATE_FORMAT(er.registered_at, '%Y-%m-%d %H:%i:%s') AS registered_at,
        e.id AS event_id,
        e.title,
        e.description,
        e.venue,
        DATE_FORMAT(e.event_date, '%Y-%m-%d') AS event_date,
        e.start_time,
        e.end_time,
        e.status AS event_status,
        c.club_name,
        ec.category_name
      FROM event_registrations er
      JOIN events e ON er.event_id = e.id
      JOIN clubs c ON e.club_id = c.id
      JOIN event_categories ec ON e.category_id = ec.id
      WHERE er.user_id = ?
      ORDER BY e.event_date DESC, e.start_time DESC
    `;

    const [rows] = await pool.query(query, [userId]);
    return sendSuccess(res, 'Registrations fetched successfully.', rows);
  } catch (error) {
    next(error);
  }
};

// GET /api/events/:id/attendees (Coordinator of club or Admin)
const getEventAttendees = async (req, res, next) => {
  try {
    const eventId = req.params.id;

    // Check event & permissions
    const [events] = await pool.query(
      `SELECT e.id, e.title, e.max_participants, c.coordinator_id 
       FROM events e 
       JOIN clubs c ON e.club_id = c.id 
       WHERE e.id = ?`,
      [eventId]
    );

    if (events.length === 0) {
      return sendError(res, 'Event not found.', 404);
    }

    if (req.user.role !== 'admin' && events[0].coordinator_id !== req.user.id) {
      return sendError(res, 'You are not authorized to view attendee rosters for this event.', 403);
    }

    const query = `
      SELECT 
        er.id AS registration_id,
        er.registration_status,
        DATE_FORMAT(er.registered_at, '%Y-%m-%d %H:%i:%s') AS registered_at,
        u.id AS user_id,
        u.name,
        u.email,
        u.role
      FROM event_registrations er
      JOIN users u ON er.user_id = u.id
      WHERE er.event_id = ?
      ORDER BY er.registered_at ASC
    `;

    const [attendees] = await pool.query(query, [eventId]);
    return sendSuccess(res, 'Attendees fetched successfully.', {
      event_id: Number(eventId),
      event_title: events[0].title,
      max_participants: events[0].max_participants,
      total_registered: attendees.filter(a => a.registration_status === 'registered').length,
      total_attended: attendees.filter(a => a.registration_status === 'attended').length,
      attendees
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/registrations/:id/attendance (Coordinator or Admin)
const updateAttendance = async (req, res, next) => {
  try {
    const registrationId = req.params.id;
    const { status } = req.body;

    const validStatuses = ['registered', 'attended', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return sendError(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    // Verify registration and club coordinator
    const [regs] = await pool.query(
      `SELECT er.id, e.id AS event_id, c.coordinator_id 
       FROM event_registrations er
       JOIN events e ON er.event_id = e.id
       JOIN clubs c ON e.club_id = c.id
       WHERE er.id = ?`,
      [registrationId]
    );

    if (regs.length === 0) {
      return sendError(res, 'Registration record not found.', 404);
    }

    if (req.user.role !== 'admin' && regs[0].coordinator_id !== req.user.id) {
      return sendError(res, 'You are not authorized to update this registration status.', 403);
    }

    await pool.query(
      'UPDATE event_registrations SET registration_status = ? WHERE id = ?',
      [status, registrationId]
    );

    return sendSuccess(res, `Attendance marked as '${status}'.`, {
      registration_id: Number(registrationId),
      status
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
  getEventAttendees,
  updateAttendance
};
