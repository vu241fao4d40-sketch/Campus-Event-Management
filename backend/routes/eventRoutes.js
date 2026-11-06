const express = require('express');
const router = express.Router();
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  updateEventStatus,
  deleteEvent
} = require('../controllers/eventController');
const {
  registerForEvent,
  cancelRegistration,
  getEventAttendees
} = require('../controllers/registrationController');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/authorize');

// Public / optional auth
router.get('/', optionalAuth, getAllEvents);
router.get('/:id', optionalAuth, getEventById);

// Protected: Event authoring & management
router.post('/', verifyToken, authorizeRoles('admin', 'coordinator'), createEvent);
router.put('/:id', verifyToken, authorizeRoles('admin', 'coordinator'), updateEvent);
router.patch('/:id/status', verifyToken, authorizeRoles('admin', 'coordinator'), updateEventStatus);
router.delete('/:id', verifyToken, authorizeRoles('admin'), deleteEvent);

// Registration actions on an event
router.post('/:id/register', verifyToken, registerForEvent);
router.post('/:id/cancel', verifyToken, cancelRegistration);
router.get('/:id/attendees', verifyToken, authorizeRoles('admin', 'coordinator'), getEventAttendees);

module.exports = router;
