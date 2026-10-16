const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const signToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const sendAuth = (res, status, user) =>
  res.status(status).json({ success: true, token: signToken(user), user: user.toPublicJSON() });

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 */
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ email: email.toLowerCase().trim() });
  if (exists) throw new ApiError(409, 'An account with this email already exists');

  const user = await User.create({ name, email, password });
  sendAuth(res, 201, user);
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password +lockPassword');
  // Same message for "no user" and "wrong password" so emails can't be guessed
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Incorrect email or password');
  }

  sendAuth(res, 200, user);
});

/**
 * GET /api/auth/me   (protected)
 * Returns the currently logged-in user.
 */
exports.me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toPublicJSON() });
});

/**
 * PUT /api/auth/lock-password   (protected)
 * Sets the password used to open locked notes.
 * Body: { newPassword, currentPassword? }  – currentPassword is required when changing it.
 */
exports.setLockPassword = asyncHandler(async (req, res) => {
  const { newPassword, currentPassword } = req.body || {};

  if (typeof newPassword !== 'string' || newPassword.length < 4) {
    throw new ApiError(400, 'Validation failed', { newPassword: 'Lock password must be at least 4 characters' });
  }

  const user = req.user;
  if (user.lockPassword && !(await user.compareLockPassword(currentPassword))) {
    // 403 (not 401) – the user is logged in, only the lock password is wrong
    throw new ApiError(403, 'Current lock password is incorrect', { currentPassword: 'Incorrect lock password' });
  }

  const changed = Boolean(user.lockPassword);
  await user.setLockPassword(newPassword);
  await user.save();

  res.json({ success: true, message: changed ? 'Lock password changed' : 'Lock password set', user: user.toPublicJSON() });
});
