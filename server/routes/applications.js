const express = require('express');
const { getDB } = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply to position (student only)
router.post('/', authenticateToken, requireRole('student'), (req, res) => {
  const { position_id } = req.body;

  if (!position_id) {
    return res.status(400).json({ error: 'Position ID is required' });
  }

  const db = getDB();

  // Check if already applied
  db.get(
    'SELECT * FROM applications WHERE student_id = ? AND position_id = ?',
    [req.user.id, position_id],
    (err, existing) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (existing) {
        return res.status(400).json({ error: 'Already applied to this position' });
      }

      // Create application
      db.run(
        'INSERT INTO applications (student_id, position_id, status) VALUES (?, ?, ?)',
        [req.user.id, position_id, 'applied'],
        function(insertErr) {
          if (insertErr) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.status(201).json({
            application_id: this.lastID,
            message: 'Application submitted successfully'
          });
        }
      );
    }
  );
});

// Get student's applications
router.get('/my-applications', authenticateToken, requireRole('student'), (req, res) => {
  const db = getDB();
  db.all(
    `SELECT a.*, p.job_title, p.job_description, p.status as position_status, 
     e.company_name, p.selected_student_id
     FROM applications a
     JOIN positions p ON a.position_id = p.position_id
     JOIN employers e ON p.employer_id = e.employer_id
     WHERE a.student_id = ?
     ORDER BY a.application_date DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

// Get applicants for a position (employer only)
router.get('/position/:positionId', authenticateToken, requireRole('employer'), (req, res) => {
  const db = getDB();
  const positionId = req.params.positionId;

  // Verify ownership
  db.get('SELECT employer_id FROM positions WHERE position_id = ?', [positionId], (err, position) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!position) {
      return res.status(404).json({ error: 'Position not found' });
    }
    if (position.employer_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    db.all(
      `SELECT a.*, s.full_name, s.email, s.phone, s.department, s.major, s.gpa, 
       s.credit_hours, s.resume_path, s.semester_started, s.is_transfer
       FROM applications a
       JOIN students s ON a.student_id = s.student_id
       WHERE a.position_id = ?
       ORDER BY a.application_date DESC`,
      [positionId],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
      }
    );
  });
});

// Update application status (employer only)
router.put('/:id/status', authenticateToken, requireRole('employer'), (req, res) => {
  const { status } = req.body;
  const applicationId = req.params.id;

  if (!['applied', 'shortlisted', 'rejected', 'selected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const db = getDB();

  // Verify ownership through position
  db.get(
    `SELECT p.employer_id FROM applications a
     JOIN positions p ON a.position_id = p.position_id
     WHERE a.application_id = ?`,
    [applicationId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!result) {
        return res.status(404).json({ error: 'Application not found' });
      }
      if (result.employer_id !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      db.run(
        'UPDATE applications SET status = ? WHERE application_id = ?',
        [status, applicationId],
        function(updateErr) {
          if (updateErr) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.json({ message: 'Application status updated successfully' });
        }
      );
    }
  );
});

module.exports = router;

