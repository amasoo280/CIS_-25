const express = require('express');
const { getDB } = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get student profile
router.get('/profile', authenticateToken, requireRole('student'), (req, res) => {
  const db = getDB();
  db.get(
    `SELECT student_id, full_name, email, phone, department, major, credit_hours, gpa, 
     semester_started, is_transfer, resume_path 
     FROM students WHERE student_id = ?`,
    [req.user.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Student not found' });
      }
      res.json(row);
    }
  );
});

// Update student profile
router.put('/profile', authenticateToken, requireRole('student'), (req, res) => {
  const {
    full_name,
    phone,
    department,
    major,
    credit_hours,
    gpa,
    semester_started,
    is_transfer
  } = req.body;

  const db = getDB();

  db.run(
    `UPDATE students 
     SET full_name = ?, phone = ?, department = ?, major = ?, credit_hours = ?, 
         gpa = ?, semester_started = ?, is_transfer = ?
     WHERE student_id = ?`,
    [full_name, phone, department, major, credit_hours, gpa, semester_started, is_transfer ? 1 : 0, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Profile updated successfully' });
    }
  );
});

// Update resume path
router.put('/resume', authenticateToken, requireRole('student'), (req, res) => {
  const { resume_path } = req.body;
  const db = getDB();

  db.run(
    'UPDATE students SET resume_path = ? WHERE student_id = ?',
    [resume_path, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Resume updated successfully', resume_path });
    }
  );
});

module.exports = router;

