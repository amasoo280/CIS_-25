const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'coop_portal.db');

let db = null;

function getDB() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to SQLite database');
        // Enable foreign keys
        db.run('PRAGMA foreign_keys = ON');
      }
    });
  }
  return db;
}

function closeDB() {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
        db = null;
      }
    });
  }
}

module.exports = { getDB, closeDB };

