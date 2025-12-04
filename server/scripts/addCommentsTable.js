/**
 * Migration script to add employer_comments table
 * Run this once to add the comments feature to existing databases
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../database/coop_portal.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to database');
});

// Create employer_comments table
db.run(`
  CREATE TABLE IF NOT EXISTS employer_comments (
    comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    enrollment_id INTEGER NOT NULL,
    employer_id INTEGER NOT NULL,
    comment_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES coop_enrollments(enrollment_id),
    FOREIGN KEY (employer_id) REFERENCES employers(employer_id)
  )
`, function(err) {
  if (err) {
    console.error('Error creating employer_comments table:', err.message);
  } else {
    console.log('✅ employer_comments table created successfully (or already exists)');
  }
  
  db.close((closeErr) => {
    if (closeErr) {
      console.error('Error closing database:', closeErr.message);
    } else {
      console.log('Database connection closed');
    }
  });
});