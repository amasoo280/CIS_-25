const express = require('express');
const { getDB } = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get co-op enrollment for student
router.get('/my-enrollment', authenticateToken, requireRole('student'), (req, res) => {
  const db = getDB();
  db.all(
    `SELECT ce.*, p.job_title, p.job_description, e.company_name, p.number_of_weeks, p.hours_per_week
     FROM coop_enrollments ce
     JOIN positions p ON ce.position_id = p.position_id
     JOIN employers e ON p.employer_id = e.employer_id
     WHERE ce.student_id = ?
     ORDER BY ce.created_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

// Opt-in for co-op credit
router.post('/opt-in', authenticateToken, requireRole('student'), (req, res) => {
  const { position_id } = req.body;

  if (!position_id) {
    return res.status(400).json({ error: 'Position ID is required' });
  }

  const db = getDB();

  // Verify enrollment exists and student is eligible
  db.get(
    `SELECT * FROM coop_enrollments 
     WHERE student_id = ? AND position_id = ? AND eligibility_result = 'eligible'`,
    [req.user.id, position_id],
    (err, enrollment) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!enrollment) {
        return res.status(404).json({ error: 'No eligible enrollment found for this position' });
      }

      // Update opt-in status
      db.run(
        `UPDATE coop_enrollments 
         SET opt_in = 1, updated_at = CURRENT_TIMESTAMP
         WHERE enrollment_id = ?`,
        [enrollment.enrollment_id],
        function(updateErr) {
          if (updateErr) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.json({ message: 'Successfully opted in for co-op credit' });
        }
      );
    }
  );
});

// Opt-out from co-op credit
router.post('/opt-out', authenticateToken, requireRole('student'), (req, res) => {
  const { position_id } = req.body;

  if (!position_id) {
    return res.status(400).json({ error: 'Position ID is required' });
  }

  const db = getDB();

  db.run(
    `UPDATE coop_enrollments 
     SET opt_in = 0, updated_at = CURRENT_TIMESTAMP
     WHERE student_id = ? AND position_id = ?`,
    [req.user.id, position_id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Successfully opted out of co-op credit' });
    }
  );
});

// Submit co-op summary
router.post('/summary', authenticateToken, requireRole('student'), (req, res) => {
  const { position_id, coop_summary } = req.body;

  if (!position_id || !coop_summary) {
    return res.status(400).json({ error: 'Position ID and summary are required' });
  }

  const db = getDB();

  // Verify enrollment exists and student has opted in
  db.get(
    `SELECT * FROM coop_enrollments 
     WHERE student_id = ? AND position_id = ? AND opt_in = 1`,
    [req.user.id, position_id],
    (err, enrollment) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!enrollment) {
        return res.status(404).json({ error: 'No co-op enrollment found or not opted in' });
      }

      // Update summary
      db.run(
        `UPDATE coop_enrollments 
         SET coop_summary = ?, updated_at = CURRENT_TIMESTAMP
         WHERE enrollment_id = ?`,
        [coop_summary, enrollment.enrollment_id],
        function(updateErr) {
          if (updateErr) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.json({ message: 'Co-op summary submitted successfully' });
        }
      );
    }
  );
});

module.exports = router;

