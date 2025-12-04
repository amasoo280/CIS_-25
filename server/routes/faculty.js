const express = require('express');
const { getDB } = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get faculty profile
router.get('/profile', authenticateToken, requireRole('faculty'), (req, res) => {
  const db = getDB();
  db.get(
    'SELECT faculty_id, full_name, email, department FROM faculty WHERE faculty_id = ?',
    [req.user.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Faculty not found' });
      }
      res.json(row);
    }
  );
});

// Update faculty profile
router.put('/profile', authenticateToken, requireRole('faculty'), (req, res) => {
  const { full_name } = req.body;
  const db = getDB();

  db.run(
    `UPDATE faculty SET full_name = ? WHERE faculty_id = ?`,
    [full_name, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Profile updated successfully' });
    }
  );
});

// Get coordinator statistics (case-insensitive department matching)
router.get('/stats', authenticateToken, requireRole('faculty'), (req, res) => {
  const db = getDB();

  // Get faculty's department
  db.get('SELECT department FROM faculty WHERE faculty_id = ?', [req.user.id], (err, faculty) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty not found' });
    }

    // Get statistics for the department (case-insensitive)
    db.get(
      `SELECT 
        COUNT(*) as total_coop_students,
        SUM(CASE WHEN grade IS NOT NULL AND grade != '' THEN 1 ELSE 0 END) as graded,
        SUM(CASE WHEN (grade IS NULL OR grade = '') AND opt_in = 1 THEN 1 ELSE 0 END) as pending_grade,
        SUM(CASE WHEN coop_summary IS NOT NULL AND coop_summary != '' THEN 1 ELSE 0 END) as summaries_submitted
       FROM coop_enrollments
       WHERE LOWER(department) = LOWER(?) AND opt_in = 1`,
      [faculty.department],
      (err, stats) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json(stats || { total_coop_students: 0, graded: 0, pending_grade: 0, summaries_submitted: 0 });
      }
    );
  });
});

// Get all co-op students in faculty's department (case-insensitive)
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

    // Get all co-op students in that department who have opted in (case-insensitive)
    db.all(
      `SELECT ce.*, s.full_name, s.email, s.phone, s.major, s.gpa, s.credit_hours, s.semester_started, s.is_transfer, s.resume_path,
       p.job_title, p.job_description, p.number_of_weeks, p.hours_per_week, p.job_location,
       e.company_name, e.location as employer_location
       FROM coop_enrollments ce
       JOIN students s ON ce.student_id = s.student_id
       JOIN positions p ON ce.position_id = p.position_id
       JOIN employers e ON p.employer_id = e.employer_id
       WHERE LOWER(ce.department) = LOWER(?) AND ce.opt_in = 1
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

// Get single co-op enrollment details (case-insensitive)
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
       WHERE ce.enrollment_id = ? AND LOWER(ce.department) = LOWER(?)`,
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

// Assign grade to co-op student (case-insensitive)
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

    // Verify enrollment is in faculty's department (case-insensitive)
    db.get(
      `SELECT * FROM coop_enrollments 
       WHERE enrollment_id = ? AND LOWER(department) = LOWER(?)`,
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

// Get employer comments for an enrollment (case-insensitive)
router.get('/coop-students/:enrollmentId/comments', authenticateToken, requireRole('faculty'), (req, res) => {
  const db = getDB();
  const enrollmentId = req.params.enrollmentId;

  // Get faculty's department
  db.get('SELECT department FROM faculty WHERE faculty_id = ?', [req.user.id], (err, faculty) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    db.all(
      `SELECT ec.*, e.company_name, e.contact_name
       FROM employer_comments ec
       JOIN coop_enrollments ce ON ec.enrollment_id = ce.enrollment_id
       JOIN positions p ON ce.position_id = p.position_id
       JOIN employers e ON p.employer_id = e.employer_id
       WHERE ec.enrollment_id = ? AND LOWER(ce.department) = LOWER(?)
       ORDER BY ec.created_at DESC`,
      [enrollmentId, faculty.department],
      (err, rows) => {
        if (err) {
          // Table might not exist yet, return empty array
          return res.json([]);
        }
        res.json(rows || []);
      }
    );
  });
});

module.exports = router;