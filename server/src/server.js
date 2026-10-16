require('dotenv').config();
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.warn('⚠  JWT_SECRET is not set – using an insecure development secret. Copy .env.example to .env.');
  process.env.JWT_SECRET = 'dev_only_insecure_secret';
}

async function start() {
  try {
    await connectDB();
    const server = app.listen(PORT, '0.0.0.0',() => {
      console.log(`✔  API running on http://localhost:${PORT}/api`);
    });

    // Close the database cleanly on Ctrl+C
    const shutdown = async () => {
      console.log('\nShutting down…');
      server.close();
      await disconnectDB();
      process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('✖  Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
