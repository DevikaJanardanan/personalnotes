const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * protect – guards private routes.
 * Expects the header:  Authorization: Bearer <token>
 * On success, attaches the logged-in user to req.user.
 */
const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(401, 'Not authorised – please log in');
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Session expired or invalid – please log in again');
  }

  const user = await User.findById(payload.id).select('+lockPassword');
  if (!user) throw new ApiError(401, 'User no longer exists');

  req.user = user;
  next();
});

module.exports = { protect };
