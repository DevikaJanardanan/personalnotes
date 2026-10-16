const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, me, setLockPassword } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Slow down password-guessing: max 20 auth attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === 'test' ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts – please try again in a few minutes' },
});

router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
router.get('/me', protect, me);
router.put('/lock-password', protect, authLimiter, setLockPassword);

module.exports = router;
