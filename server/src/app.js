const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// ---- Security & parsing middleware ----
app.use(helmet());
app.use(
  cors({
    origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(','),
  })
);
app.use(express.json({ limit: '100kb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// ---- Routes ----
app.get('/api/health', (_req, res) => res.json({ success: true, status: 'ok', time: new Date() }));
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);

// ---- Errors ----
app.use('/api', notFound);
app.use(errorHandler);

module.exports = app;
