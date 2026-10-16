const express = require('express');
const rateLimit = require('express-rate-limit');
const c = require('../controllers/noteController');
const { protect } = require('../middleware/auth');
const { validateNote } = require('../middleware/validate');

const router = express.Router();

// Limit lock-password guesses: 30 attempts per 15 minutes per IP
const lockLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === 'test' ? 1000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts – please try again in a few minutes' },
});

// Every notes route requires a valid login token
router.use(protect);

router.route('/')
  .get(c.getNotes)                                    // GET    /api/notes
  .post(validateNote({ partial: false }), c.createNote); // POST   /api/notes

router.get('/stats', c.getStats);                     // GET    /api/notes/stats

router.route('/:id')
  .get(c.getNote)                                     // GET    /api/notes/:id
  .put(validateNote({ partial: true }), c.updateNote) // PUT    /api/notes/:id
  .delete(c.deleteNote);                              // DELETE /api/notes/:id

router.patch('/:id/pin', c.togglePin);                // PATCH  /api/notes/:id/pin
router.patch('/:id/lock', lockLimiter, c.toggleLock);   // PATCH  /api/notes/:id/lock
router.post('/:id/unlock', lockLimiter, c.unlockNote);  // POST   /api/notes/:id/unlock

module.exports = router;
