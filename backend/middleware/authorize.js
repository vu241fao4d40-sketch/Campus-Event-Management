const { sendError } = require('../utils/response');

/**
 * Role-Based Access Control Middleware
 * @param  {...string} roles Allowed roles ('admin', 'coordinator', 'student')
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Access forbidden. Requires one of roles: [${roles.join(', ')}]. Your role is '${req.user.role}'.`,
        403
      );
    }

    next();
  };
};

module.exports = {
  authorizeRoles
};
