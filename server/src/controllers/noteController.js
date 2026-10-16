const mongoose = require('mongoose');
const Note = require('../models/Note');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Escape user input before using it inside a RegExp (prevents regex injection)
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SORTS = {
  updated: { editedAt: -1, updatedAt: -1 },
  created: { createdAt: -1 },
  oldest: { createdAt: 1 },
  title: { title: 1 },
};

// Fields whose change counts as "editing" the note
const WRITING_FIELDS = ['title', 'content', 'tags', 'color'];

/**
 * What the client is allowed to see of a note.
 * For a LOCKED note only the title and dates are sent – the content and tags
 * stay on the server until the correct lock password is given (see unlockNote).
 */
function toClient(note, { reveal = false } = {}) {
  const json = note.toJSON();
  if (json.locked && !reveal) {
    json.content = '';
    json.tags = [];
  }
  return json;
}

/**
 * Finds a note that belongs to the logged-in user, or throws 404.
 * Because the query includes `user: req.user._id`, a user can never
 * read or change somebody else's note – even if they know its id.
 */
async function findOwnNote(req) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(404, 'Note not found');
  const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
  if (!note) throw new ApiError(404, 'Note not found');
  return note;
}

/**
 * Checks the lock password. Uses 403 (not 401) because the user IS logged in –
 * only the lock password is wrong, so the app should not log them out.
 */
async function requireLockPassword(req, password) {
  if (!req.user.lockPassword) throw new ApiError(400, 'Set a lock password first');
  if (!password) throw new ApiError(403, 'This note is locked – enter your lock password');
  if (!(await req.user.compareLockPassword(password))) throw new ApiError(403, 'Incorrect lock password');
}

/**
 * GET /api/notes
 * Query params (all optional):
 *   search – text to look for in title, content or tags (locked notes: title only)
 *   tag    – only notes with this tag
 *   pinned – "true" | "false"
 *   locked – "true" | "false"
 *   sort   – updated (default) | created | oldest | title
 * Pinned notes always come first.
 */
exports.getNotes = asyncHandler(async (req, res) => {
  const { search, tag, pinned, locked, sort } = req.query;

  const filter = { user: req.user._id };

  if (typeof search === 'string' && search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    // Locked notes can only be found by their title, never by their hidden content
    filter.$or = [{ title: rx }, { content: rx, locked: { $ne: true } }, { tags: rx, locked: { $ne: true } }];
  }
  if (typeof tag === 'string' && tag.trim()) {
    filter.tags = tag.trim().toLowerCase();
    filter.locked = { $ne: true };
  }
  if (pinned === 'true' || pinned === 'false') filter.pinned = pinned === 'true';
  if (locked === 'true') filter.locked = true;
  if (locked === 'false') filter.locked = { $ne: true }; // also matches notes created before locking existed

  const order = { pinned: -1, ...(SORTS[sort] || SORTS.updated), _id: -1 };
  const notes = await Note.find(filter).sort(order);

  res.json({ success: true, count: notes.length, notes: notes.map((n) => toClient(n)) });
});

/**
 * GET /api/notes/stats
 * Totals and per-tag counts for the logged-in user (MongoDB aggregation).
 * Tags of locked notes are not counted, so they cannot leak.
 */
exports.getStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [totals] = await Note.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pinned: { $sum: { $cond: ['$pinned', 1, 0] } },
        locked: { $sum: { $cond: ['$locked', 1, 0] } },
      },
    },
  ]);

  const tags = await Note.aggregate([
    { $match: { user: userId, locked: { $ne: true } } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $project: { _id: 0, tag: '$_id', count: 1 } },
  ]);

  res.json({
    success: true,
    stats: {
      total: totals?.total || 0,
      pinned: totals?.pinned || 0,
      locked: totals?.locked || 0,
      tags,
    },
  });
});

/** GET /api/notes/:id  (a locked note comes back without its content) */
exports.getNote = asyncHandler(async (req, res) => {
  const note = await findOwnNote(req);
  res.json({ success: true, note: toClient(note) });
});

/**
 * POST /api/notes/:id/unlock
 * Body: { password }  – returns the full locked note if the lock password is right.
 */
exports.unlockNote = asyncHandler(async (req, res) => {
  const note = await findOwnNote(req);
  if (note.locked) await requireLockPassword(req, req.body?.password);
  res.json({ success: true, note: toClient(note, { reveal: true }) });
});

/**
 * POST /api/notes
 * Body: { title, content?, tags?, pinned?, color? }
 * Returns the created note (with createdAt / updatedAt / editedAt timestamps).
 */
exports.createNote = asyncHandler(async (req, res) => {
  const note = await Note.create({ ...req.body, user: req.user._id });
  res.status(201).json({ success: true, note: toClient(note) });
});

/**
 * PUT /api/notes/:id
 * Body: any subset of { title, content, tags, pinned, color }
 * Locked notes also need the header  X-Lock-Password: <lock password>
 * Returns the updated note.
 */
exports.updateNote = asyncHandler(async (req, res) => {
  const note = await findOwnNote(req);
  if (note.locked) await requireLockPassword(req, req.get('x-lock-password'));

  const before = JSON.stringify(WRITING_FIELDS.map((f) => note[f]));
  Object.assign(note, req.body);
  const after = JSON.stringify(WRITING_FIELDS.map((f) => note[f]));
  if (before !== after) note.editedAt = new Date();

  await note.save();
  res.json({ success: true, note: toClient(note, { reveal: true }) });
});

/** PATCH /api/notes/:id/pin – toggles the pinned flag */
exports.togglePin = asyncHandler(async (req, res) => {
  const note = await findOwnNote(req);
  note.pinned = !note.pinned;
  await note.save();
  res.json({ success: true, note: toClient(note) });
});

/**
 * PATCH /api/notes/:id/lock
 * Locks an unlocked note (a lock password must already be set), or removes the
 * lock from a locked note (body: { password } required).
 */
exports.toggleLock = asyncHandler(async (req, res) => {
  const note = await findOwnNote(req);

  if (note.locked) {
    await requireLockPassword(req, req.body?.password);
    note.locked = false;
  } else {
    if (!req.user.lockPassword) throw new ApiError(400, 'Set a lock password first');
    note.locked = true;
  }

  await note.save();
  res.json({ success: true, note: toClient(note) });
});

/** DELETE /api/notes/:id  (locked notes need the X-Lock-Password header) */
exports.deleteNote = asyncHandler(async (req, res) => {
  const note = await findOwnNote(req);
  if (note.locked) await requireLockPassword(req, req.get('x-lock-password'));
  await note.deleteOne();
  res.json({ success: true, message: 'Note deleted', id: note._id });
});
