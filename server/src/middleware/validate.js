const ApiError = require('../utils/ApiError');
const { NOTE_COLORS } = require('../models/Note');

const isString = (v) => typeof v === 'string';
const isBool = (v) => typeof v === 'boolean';

/**
 * Validates and whitelists the JSON body of a note request.
 * Only known fields are copied to req.body – anything else (e.g. "user")
 * is dropped so a client can never re-assign a note to another account.
 *
 * @param {{ partial: boolean }} opts  partial=true for PUT (all fields optional)
 */
const validateNote = ({ partial }) => (req, _res, next) => {
  const body = req.body || {};
  const errors = {};
  const clean = {};

  if ('title' in body || !partial) {
    if (!isString(body.title) || !body.title.trim()) errors.title = 'Title is required';
    else if (body.title.trim().length > 120) errors.title = 'Title must be at most 120 characters';
    else clean.title = body.title.trim();
  }

  if ('content' in body) {
    if (!isString(body.content)) errors.content = 'Content must be text';
    else if (body.content.length > 20000) errors.content = 'Content must be at most 20,000 characters';
    else clean.content = body.content;
  }

  if ('tags' in body) {
    const ok = Array.isArray(body.tags) && body.tags.every(isString);
    if (!ok) errors.tags = 'Tags must be an array of strings';
    else if (body.tags.length > 10) errors.tags = 'A note can have at most 10 tags';
    else clean.tags = body.tags;
  }

  for (const flag of ['pinned']) {
    if (flag in body) {
      if (!isBool(body[flag])) errors[flag] = `${flag} must be true or false`;
      else clean[flag] = body[flag];
    }
  }

  if ('color' in body) {
    if (!NOTE_COLORS.includes(body.color)) errors.color = `Color must be one of: ${NOTE_COLORS.join(', ')}`;
    else clean.color = body.color;
  }

  if (Object.keys(errors).length) return next(new ApiError(400, 'Validation failed', errors));
  if (partial && Object.keys(clean).length === 0) {
    return next(new ApiError(400, 'Nothing to update – send at least one note field'));
  }

  req.body = clean;
  next();
};

const validateRegister = (req, _res, next) => {
  const { name, email, password } = req.body || {};
  const errors = {};
  if (!isString(name) || !name.trim()) errors.name = 'Name is required';
  if (!isString(email) || !/^\S+@\S+\.\S+$/.test(email)) errors.email = 'A valid email is required';
  if (!isString(password) || password.length < 6) errors.password = 'Password must be at least 6 characters';
  if (Object.keys(errors).length) return next(new ApiError(400, 'Validation failed', errors));
  next();
};

const validateLogin = (req, _res, next) => {
  const { email, password } = req.body || {};
  if (!isString(email) || !isString(password) || !email || !password) {
    return next(new ApiError(400, 'Email and password are required'));
  }
  next();
};

module.exports = { validateNote, validateRegister, validateLogin };
