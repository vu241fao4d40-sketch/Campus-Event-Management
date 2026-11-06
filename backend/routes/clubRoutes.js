const express = require('express');
const router = express.Router();
const {
  getAllClubs,
  getClubById,
  createClub,
  updateClub,
  deleteClub,
  joinClub,
  leaveClub,
  getClubMembers
} = require('../controllers/clubController');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/authorize');

router.get('/', optionalAuth, getAllClubs);
router.get('/:id', optionalAuth, getClubById);
router.post('/', verifyToken, authorizeRoles('admin'), createClub);
router.put('/:id', verifyToken, authorizeRoles('admin', 'coordinator'), updateClub);
router.delete('/:id', verifyToken, authorizeRoles('admin'), deleteClub);

// Membership routes
router.post('/:id/join', verifyToken, joinClub);
router.post('/:id/leave', verifyToken, leaveClub);
router.get('/:id/members', verifyToken, authorizeRoles('admin', 'coordinator'), getClubMembers);

module.exports = router;
