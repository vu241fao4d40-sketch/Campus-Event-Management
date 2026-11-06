const { pool } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

// GET /api/categories
const getAllCategories = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        c.id, 
        c.category_name, 
        c.description, 
        c.created_at,
        COUNT(e.id) AS event_count
      FROM event_categories c
      LEFT JOIN events e ON c.id = e.category_id
      GROUP BY c.id
      ORDER BY c.category_name ASC
    `;
    const [categories] = await pool.query(query);
    return sendSuccess(res, 'Categories fetched successfully.', categories);
  } catch (error) {
    next(error);
  }
};

// POST /api/categories (Admin)
const createCategory = async (req, res, next) => {
  try {
    const { category_name, description } = req.body;

    if (!category_name || !category_name.trim()) {
      return sendError(res, 'Category name is required.', 400);
    }

    const [existing] = await pool.query(
      'SELECT id FROM event_categories WHERE category_name = ?',
      [category_name.trim()]
    );
    if (existing.length > 0) {
      return sendError(res, 'A category with this name already exists.', 409);
    }

    const [result] = await pool.query(
      'INSERT INTO event_categories (category_name, description) VALUES (?, ?)',
      [category_name.trim(), description ? description.trim() : null]
    );

    return sendSuccess(
      res,
      'Category created successfully!',
      {
        id: result.insertId,
        category_name: category_name.trim(),
        description: description ? description.trim() : null
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// PUT /api/categories/:id (Admin)
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category_name, description } = req.body;

    if (!category_name || !category_name.trim()) {
      return sendError(res, 'Category name is required.', 400);
    }

    // Check duplicate name excluding this ID
    const [existing] = await pool.query(
      'SELECT id FROM event_categories WHERE category_name = ? AND id != ?',
      [category_name.trim(), id]
    );
    if (existing.length > 0) {
      return sendError(res, 'Another category with this name already exists.', 409);
    }

    const [result] = await pool.query(
      'UPDATE event_categories SET category_name = ?, description = ? WHERE id = ?',
      [category_name.trim(), description ? description.trim() : null, id]
    );

    if (result.affectedRows === 0) {
      return sendError(res, 'Category not found.', 404);
    }

    return sendSuccess(res, 'Category updated successfully!', {
      id: Number(id),
      category_name: category_name.trim(),
      description: description ? description.trim() : null
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/categories/:id (Admin)
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if category has associated events
    const [events] = await pool.query('SELECT id FROM events WHERE category_id = ? LIMIT 1', [id]);
    if (events.length > 0) {
      return sendError(
        res,
        'Cannot delete category because it is currently assigned to existing events. Reassign or remove those events first.',
        400
      );
    }

    const [result] = await pool.query('DELETE FROM event_categories WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return sendError(res, 'Category not found.', 404);
    }

    return sendSuccess(res, 'Category deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
