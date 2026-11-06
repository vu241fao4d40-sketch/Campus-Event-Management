const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  updateUserRole
} = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/authorize');

router.get('/', verifyToken, authorizeRoles('admin'), getAllUsers);
router.patch('/:id/role', verifyToken, authorizeRoles('admin'), updateUserRole);

module.exports = router;
