const express = require('express');
const router = express.Router();
const {
  getMyRegistrations,
  updateAttendance
} = require('../controllers/registrationController');
const { verifyToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/authorize');

// Student viewing own registrations
router.get('/my', verifyToken, getMyRegistrations);

// Coordinator/Admin updating attendee attendance
router.patch('/:id/attendance', verifyToken, authorizeRoles('admin', 'coordinator'), updateAttendance);

module.exports = router;
