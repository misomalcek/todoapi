'use strict';

const fs = require('fs');
const path = require('path');
const { createApp } = require('./app');
const { createDb } = require('./db');

const PORT = process.env.PORT || 3000;

// Ensure the data directory exists for the on-disk SQLite file.
const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = createDb();
const app = createApp(db);

const server = app.listen(PORT, () => {
  console.log(`Todo API listening on http://localhost:${PORT}`);
});

// Graceful shutdown
function shutdown() {
  console.log('\nShutting down...');
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
