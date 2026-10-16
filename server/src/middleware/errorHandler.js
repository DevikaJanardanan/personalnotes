const ApiError = require('../utils/ApiError');

// 404 for any /api route that does not exist
function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Central error handler – converts every error into a consistent JSON shape:
 *   { "success": false, "message": "...", "details": { field: message } }
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let details = err.details;

  // Mongoose schema validation failed
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation failed';
    details = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
  }

  // Invalid MongoDB ObjectId in the URL
  if (err.name === 'CastError') {
    status = 404;
    message = 'Resource not found';
  }

  // Duplicate key (e.g. email already registered)
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `That ${field} is already in use`;
  }

  // Malformed JSON body
  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body must be valid JSON';
  }

  if (status >= 500 && process.env.NODE_ENV !== 'test') console.error(err);

  res.status(status).json({ success: false, message, ...(details && { details }) });
}

module.exports = { notFound, errorHandler, ApiError };
