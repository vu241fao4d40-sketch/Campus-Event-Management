const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { verifyToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/authorize');

router.get('/', getAllCategories);
router.post('/', verifyToken, authorizeRoles('admin'), createCategory);
router.put('/:id', verifyToken, authorizeRoles('admin'), updateCategory);
router.delete('/:id', verifyToken, authorizeRoles('admin'), deleteCategory);

module.exports = router;
