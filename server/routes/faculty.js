const express = require('express');
const { getDB } = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all co-op students in faculty's department
router.get('/coop-students', authenticateToken, requireRole('faculty'), (req, res) => {
  const db = getDB();

  // Get faculty's department
  db.get('SELECT department FROM faculty WHERE faculty_id = ?', [req.user.id], (err, faculty) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty not found' });
    }

    // Get all co-op students in that department who have opted in
    db.all(
      `SELECT ce.*, s.full_name, s.email, s.phone, s.major, s.gpa, s.credit_hours,
       p.job_title, p.job_description, p.number_of_weeks, p.hours_per_week, p.job_location,
       e.company_name, e.location as employer_location
       FROM coop_enrollments ce
       JOIN students s ON ce.student_id = s.student_id
       JOIN positions p ON ce.position_id = p.position_id
       JOIN employers e ON p.employer_id = e.employer_id
       WHERE ce.department = ? AND ce.opt_in = 1
       ORDER BY ce.created_at DESC`,
      [faculty.department],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
      }
    );
  });
});

// Get single co-op enrollment details
router.get('/coop-students/:enrollmentId', authenticateToken, requireRole('faculty'), (req, res) => {
  const db = getDB();
  const enrollmentId = req.params.enrollmentId;

  // Get faculty's department
  db.get('SELECT department FROM faculty WHERE faculty_id = ?', [req.user.id], (err, faculty) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    db.get(
      `SELECT ce.*, s.full_name, s.email, s.phone, s.department, s.major, s.gpa, 
       s.credit_hours, s.semester_started, s.is_transfer, s.resume_path,
       p.job_title, p.job_description, p.number_of_weeks, p.hours_per_week, p.job_location,
       e.company_name, e.location as employer_location, e.contact_name, e.contact_email
       FROM coop_enrollments ce
       JOIN students s ON ce.student_id = s.student_id
       JOIN positions p ON ce.position_id = p.position_id
       JOIN employers e ON p.employer_id = e.employer_id
       WHERE ce.enrollment_id = ? AND ce.department = ?`,
      [enrollmentId, faculty.department],
      (err, row) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (!row) {
          return res.status(404).json({ error: 'Enrollment not found or not in your department' });
        }
        res.json(row);
      }
    );
  });
});

// Assign grade to co-op student
router.put('/coop-students/:enrollmentId/grade', authenticateToken, requireRole('faculty'), (req, res) => {
  const { grade } = req.body;
  const enrollmentId = req.params.enrollmentId;

  if (!grade) {
    return res.status(400).json({ error: 'Grade is required' });
  }

  const db = getDB();

  // Get faculty's department
  db.get('SELECT department FROM faculty WHERE faculty_id = ?', [req.user.id], (err, faculty) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Verify enrollment is in faculty's department
    db.get(
      `SELECT * FROM coop_enrollments 
       WHERE enrollment_id = ? AND department = ?`,
      [enrollmentId, faculty.department],
      (err, enrollment) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (!enrollment) {
          return res.status(404).json({ error: 'Enrollment not found or not in your department' });
        }

        // Update grade
        db.run(
          `UPDATE coop_enrollments 
           SET grade = ?, updated_at = CURRENT_TIMESTAMP
           WHERE enrollment_id = ?`,
          [grade, enrollmentId],
          function(updateErr) {
            if (updateErr) {
              return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'Grade assigned successfully' });
          }
        );
      }
    );
  });
});

module.exports = router;

