'use strict';

const path = require('path');
const Database = require('better-sqlite3');

/**
 * Create/open a SQLite database and ensure the schema exists.
 *
 * @param {string} [file] Path to the SQLite file. Use ':memory:' for tests.
 * @returns {import('better-sqlite3').Database}
 */
function createDb(file) {
  const dbPath =
    file || process.env.DB_PATH || path.join(__dirname, '..', 'data', 'todos.db');

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      title      TEXT    NOT NULL,
      completed  INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return db;
}

module.exports = { createDb };
