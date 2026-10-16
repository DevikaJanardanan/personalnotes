const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

let memoryServer = null;

/**
 * Connects to MongoDB.
 * - If MONGO_URI is set, it connects to that database (local MongoDB or Atlas).
 * - Otherwise it starts an embedded MongoDB (mongodb-memory-server) that stores
 *   its files in server/.data, so the app works without installing MongoDB.
 */
async function connectDB() {
  let uri = process.env.MONGO_URI;

  if (!uri) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const dbPath = path.join(__dirname, '..', '..', '.data');
    fs.mkdirSync(dbPath, { recursive: true });

    memoryServer = await MongoMemoryServer.create({
      instance: { dbPath, storageEngine: 'wiredTiger', dbName: 'notes_app' },
    });
    uri = memoryServer.getUri('notes_app');
    console.log('ℹ  MONGO_URI not set – using embedded MongoDB (data in server/.data)');
  }

  await mongoose.connect(uri);
  console.log(`✔  MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}

module.exports = { connectDB, disconnectDB };
