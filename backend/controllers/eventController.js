const { pool } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

// GET /api/events
const getAllEvents = async (req, res, next) => {
  try {
    const {
      search,
      category_id,
      club_id,
      status,
      timeframe // 'upcoming', 'past', or 'all'
    } = req.query;

    const userId = req.user ? req.user.id : null;
    const userRole = req.user ? req.user.role : null;

    let whereClauses = [];
    let queryParams = [];

    // Role-based visibility
    if (!userRole || userRole === 'student') {
      whereClauses.push("e.status = 'published'");
    } else if (userRole === 'coordinator') {
      // Coordinator sees published events OR draft/completed/cancelled events for their own club
      whereClauses.push("(e.status = 'published' OR c.coordinator_id = ?)");
      queryParams.push(userId);
      if (status) {
        whereClauses.push("e.status = ?");
        queryParams.push(status);
      }
    } else if (userRole === 'admin') {
      if (status) {
        whereClauses.push("e.status = ?");
        queryParams.push(status);
      }
    }

    // Filter by category
    if (category_id) {
      whereClauses.push("e.category_id = ?");
      queryParams.push(category_id);
    }

    // Filter by club
    if (club_id) {
      whereClauses.push("e.club_id = ?");
      queryParams.push(club_id);
    }

    // Filter by search string (title, venue, or description)
    if (search && search.trim()) {
      whereClauses.push("(e.title LIKE ? OR e.venue LIKE ? OR e.description LIKE ?)");
      const term = `%${search.trim()}%`;
      queryParams.push(term, term, term);
    }

    // Filter by timeframe
    const today = new Date().toISOString().slice(0, 10);
    if (timeframe === 'past') {
      whereClauses.push("e.event_date < ?");
      queryParams.push(today);
    } else if (timeframe === 'upcoming' || !timeframe) {
      whereClauses.push("e.event_date >= ?");
      queryParams.push(today);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const query = `
      SELECT 
        e.id, 
        e.club_id, 
        e.category_id, 
        e.created_by, 
        e.title, 
        e.description, 
        e.venue, 
        DATE_FORMAT(e.event_date, '%Y-%m-%d') AS event_date, 
        e.start_time, 
        e.end_time, 
        DATE_FORMAT(e.registration_deadline, '%Y-%m-%d %H:%i:%s') AS registration_deadline, 
        e.max_participants, 
        e.status, 
        e.created_at,
        c.club_name,
        c.coordinator_id,
        ec.category_name,
        u.name AS creator_name,
        COUNT(DISTINCT CASE WHEN er.registration_status = 'registered' THEN er.id END) AS registered_count,
        (e.max_participants - COUNT(DISTINCT CASE WHEN er.registration_status = 'registered' THEN er.id END)) AS seats_remaining,
        ${userId ? `MAX(CASE WHEN er.user_id = ${Number(userId)} THEN er.registration_status ELSE NULL END)` : 'NULL'} AS user_registration_status
      FROM events e
      JOIN clubs c ON e.club_id = c.id
      JOIN event_categories ec ON e.category_id = ec.id
      JOIN users u ON e.created_by = u.id
      LEFT JOIN event_registrations er ON e.id = er.event_id
      ${whereSql}
      GROUP BY e.id
      ORDER BY e.event_date ASC, e.start_time ASC
    `;

    const [events] = await pool.query(query, queryParams);
    return sendSuccess(res, 'Events fetched successfully.', events);
  } catch (error) {
    next(error);
  }
};

// GET /api/events/:id
const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;

    const query = `
      SELECT 
        e.id, 
        e.club_id, 
        e.category_id, 
        e.created_by, 
        e.title, 
        e.description, 
        e.venue, 
        DATE_FORMAT(e.event_date, '%Y-%m-%d') AS event_date, 
        e.start_time, 
        e.end_time, 
        DATE_FORMAT(e.registration_deadline, '%Y-%m-%d %H:%i:%s') AS registration_deadline, 
        e.max_participants, 
        e.status, 
        e.created_at,
        c.club_name,
        c.coordinator_id,
        ec.category_name,
        u.name AS creator_name,
        COUNT(DISTINCT CASE WHEN er.registration_status = 'registered' THEN er.id END) AS registered_count,
        (e.max_participants - COUNT(DISTINCT CASE WHEN er.registration_status = 'registered' THEN er.id END)) AS seats_remaining,
        ${userId ? `MAX(CASE WHEN er.user_id = ${Number(userId)} THEN er.registration_status ELSE NULL END)` : 'NULL'} AS user_registration_status
      FROM events e
      JOIN clubs c ON e.club_id = c.id
      JOIN event_categories ec ON e.category_id = ec.id
      JOIN users u ON e.created_by = u.id
      LEFT JOIN event_registrations er ON e.id = er.event_id
      WHERE e.id = ?
      GROUP BY e.id
    `;

    const [rows] = await pool.query(query, [id]);

    if (rows.length === 0) {
      return sendError(res, 'Event not found.', 404);
    }

    const event = rows[0];

    // Check visibility for drafts
    if (event.status === 'draft') {
      const canViewDraft = req.user && (
        req.user.role === 'admin' ||
        req.user.id === event.created_by ||
        req.user.id === event.coordinator_id
      );
      if (!canViewDraft) {
        return sendError(res, 'Event not found or not published yet.', 404);
      }
    }

    return sendSuccess(res, 'Event details fetched successfully.', event);
  } catch (error) {
    next(error);
  }
};

// POST /api/events (Coordinator or Admin)
const createEvent = async (req, res, next) => {
  try {
    const {
      club_id,
      category_id,
      title,
      description,
      venue,
      event_date,
      start_time,
      end_time,
      registration_deadline,
      max_participants,
      status = 'published'
    } = req.body;

    // Basic presence validations
    if (!club_id || !category_id || !title || !venue || !event_date || !start_time || !end_time || !registration_deadline || !max_participants) {
      return sendError(res, 'All required event fields must be provided.', 400);
    }

    // Number validations
    const participants = parseInt(max_participants, 10);
    if (isNaN(participants) || participants <= 0) {
      return sendError(res, 'Maximum participants must be a positive number.', 400);
    }

    // Check end_time > start_time
    if (start_time >= end_time) {
      return sendError(res, 'Event end time must be after the start time.', 400);
    }

    // Verify Club exists and check Coordinator permissions
    const [clubs] = await pool.query('SELECT coordinator_id FROM clubs WHERE id = ?', [club_id]);
    if (clubs.length === 0) {
      return sendError(res, 'Selected club does not exist.', 404);
    }

    if (req.user.role === 'coordinator' && clubs[0].coordinator_id !== req.user.id) {
      return sendError(res, 'You are only allowed to create events for clubs you coordinate.', 403);
    }

    // Verify Category exists
    const [categories] = await pool.query('SELECT id FROM event_categories WHERE id = ?', [category_id]);
    if (categories.length === 0) {
      return sendError(res, 'Selected category does not exist.', 404);
    }

    const validStatuses = ['draft', 'published'];
    const initialStatus = validStatuses.includes(status) ? status : 'published';

    const insertQuery = `
      INSERT INTO events (
        club_id, category_id, created_by, title, description, venue,
        event_date, start_time, end_time, registration_deadline, max_participants, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(insertQuery, [
      club_id,
      category_id,
      req.user.id,
      title.trim(),
      description ? description.trim() : null,
      venue.trim(),
      event_date,
      start_time,
      end_time,
      registration_deadline,
      participants,
      initialStatus
    ]);

    return sendSuccess(
      res,
      'Event created successfully!',
      {
        id: result.insertId,
        title: title.trim(),
        status: initialStatus
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// PUT /api/events/:id (Coordinator of club or Admin)
const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      club_id,
      category_id,
      title,
      description,
      venue,
      event_date,
      start_time,
      end_time,
      registration_deadline,
      max_participants,
      status
    } = req.body;

    const [events] = await pool.query(
      `SELECT e.*, c.coordinator_id 
       FROM events e 
       JOIN clubs c ON e.club_id = c.id 
       WHERE e.id = ?`,
      [id]
    );

    if (events.length === 0) {
      return sendError(res, 'Event not found.', 404);
    }

    const currentEvent = events[0];

    // Authorization
    if (req.user.role !== 'admin' && currentEvent.coordinator_id !== req.user.id) {
      return sendError(res, 'You are not authorized to update this event.', 403);
    }

    // Time checks if provided
    const newStart = start_time || currentEvent.start_time;
    const newEnd = end_time || currentEvent.end_time;
    if (newStart >= newEnd) {
      return sendError(res, 'Event end time must be after the start time.', 400);
    }

    const participants = max_participants ? parseInt(max_participants, 10) : currentEvent.max_participants;
    if (participants <= 0) {
      return sendError(res, 'Maximum participants must be a positive number.', 400);
    }

    const updateQuery = `
      UPDATE events SET
        club_id = ?,
        category_id = ?,
        title = ?,
        description = ?,
        venue = ?,
        event_date = ?,
        start_time = ?,
        end_time = ?,
        registration_deadline = ?,
        max_participants = ?,
        status = ?
      WHERE id = ?
    `;

    await pool.query(updateQuery, [
      club_id || currentEvent.club_id,
      category_id || currentEvent.category_id,
      title ? title.trim() : currentEvent.title,
      description !== undefined ? description : currentEvent.description,
      venue ? venue.trim() : currentEvent.venue,
      event_date || currentEvent.event_date,
      newStart,
      newEnd,
      registration_deadline || currentEvent.registration_deadline,
      participants,
      status || currentEvent.status,
      id
    ]);

    return sendSuccess(res, 'Event updated successfully!', { id: Number(id) });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/events/:id/status (Coordinator or Admin)
const updateEventStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['draft', 'published', 'cancelled', 'completed'];
    if (!status || !validStatuses.includes(status)) {
      return sendError(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const [events] = await pool.query(
      `SELECT e.id, c.coordinator_id 
       FROM events e 
       JOIN clubs c ON e.club_id = c.id 
       WHERE e.id = ?`,
      [id]
    );

    if (events.length === 0) {
      return sendError(res, 'Event not found.', 404);
    }

    if (req.user.role !== 'admin' && events[0].coordinator_id !== req.user.id) {
      return sendError(res, 'You are not authorized to update this event.', 403);
    }

    await pool.query('UPDATE events SET status = ? WHERE id = ?', [status, id]);

    return sendSuccess(res, `Event status updated to '${status}'.`, { id: Number(id), status });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/events/:id (Admin only)
const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check registrations
    const [regs] = await pool.query(
      'SELECT COUNT(*) as count FROM event_registrations WHERE event_id = ?',
      [id]
    );

    if (regs[0].count > 0) {
      return sendError(
        res,
        'Cannot delete event with existing student registrations. Consider changing status to "cancelled" instead.',
        400
      );
    }

    const [result] = await pool.query('DELETE FROM events WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return sendError(res, 'Event not found.', 404);
    }

    return sendSuccess(res, 'Event deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  updateEventStatus,
  deleteEvent
};
