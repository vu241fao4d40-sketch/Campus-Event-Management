const { sendError } = require('../utils/response');

const notFoundHandler = (req, res, next) => {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};

const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Application Error:', err);

  // Handle MySQL duplicate key error (code ER_DUP_ENTRY / 1062)
  if (err.code === 'ER_DUP_ENTRY') {
    return sendError(res, 'A record with this information already exists.', 409, err);
  }

  // Handle foreign key constraint fail (code ER_NO_REFERENCED_ROW_2 / 1452)
  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') {
    return sendError(res, 'Foreign key constraint violated. Referenced entity does not exist or is in use.', 400, err);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  return sendError(res, message, statusCode, err);
};

module.exports = {
  notFoundHandler,
  errorHandler
};
