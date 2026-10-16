/**
 * An Error that carries an HTTP status code (and optional field errors),
 * so controllers can simply `throw new ApiError(404, 'Note not found')`.
 */
class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    if (details) this.details = details;
  }
}

module.exports = ApiError;
