const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getCoordinatorStats
} = require('../controllers/statsController');
const { verifyToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/authorize');

router.get('/overview', verifyToken, authorizeRoles('admin'), getAdminStats);
router.get('/coordinator', verifyToken, authorizeRoles('coordinator'), getCoordinatorStats);

module.exports = router;
