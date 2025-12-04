const express = require('express');
const { getDB } = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get employer profile
router.get('/profile', authenticateToken, requireRole('employer'), (req, res) => {
  const db = getDB();
  db.get(
    'SELECT employer_id, company_name, location, website, contact_name, contact_email, contact_phone FROM employers WHERE employer_id = ?',
    [req.user.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Employer not found' });
      }
      res.json(row);
    }
  );
});

// Update employer profile
router.put('/profile', authenticateToken, requireRole('employer'), (req, res) => {
  const { company_name, location, website, contact_name, contact_phone } = req.body;
  const db = getDB();

  db.run(
    `UPDATE employers 
     SET company_name = ?, location = ?, website = ?, contact_name = ?, contact_phone = ?
     WHERE employer_id = ?`,
    [company_name, location, website, contact_name, contact_phone, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Profile updated successfully' });
    }
  );
});

// Get co-op students for employer's positions (students who have opted in)
router.get('/coop-students', authenticateToken, requireRole('employer'), (req, res) => {
  const db = getDB();
  
  db.all(
    `SELECT ce.*, s.full_name, s.email, s.phone, s.major, s.gpa, s.department,
     p.job_title, p.job_description, p.number_of_weeks, p.hours_per_week
     FROM coop_enrollments ce
     JOIN students s ON ce.student_id = s.student_id
     JOIN positions p ON ce.position_id = p.position_id
     WHERE p.employer_id = ? AND ce.opt_in = 1
     ORDER BY ce.created_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Get comments for each enrollment
      const enrollmentIds = rows.map(r => r.enrollment_id);
      if (enrollmentIds.length === 0) {
        return res.json([]);
      }
      
      const placeholders = enrollmentIds.map(() => '?').join(',');
      db.all(
        `SELECT * FROM employer_comments WHERE enrollment_id IN (${placeholders}) ORDER BY created_at DESC`,
        enrollmentIds,
        (commentsErr, comments) => {
          if (commentsErr) {
            console.error('Comments error:', commentsErr);
            // Return rows without comments if table doesn't exist
            return res.json(rows.map(row => ({ ...row, comments: [] })));
          }
          
          // Attach comments to each enrollment
          const result = rows.map(row => ({
            ...row,
            comments: comments.filter(c => c.enrollment_id === row.enrollment_id)
          }));
          
          res.json(result);
        }
      );
    }
  );
});

// Add comment to a co-op enrollment
router.post('/coop-students/:enrollmentId/comment', authenticateToken, requireRole('employer'), (req, res) => {
  const { comment_text } = req.body;
  const enrollmentId = req.params.enrollmentId;
  
  if (!comment_text || !comment_text.trim()) {
    return res.status(400).json({ error: 'Comment text is required' });
  }
  
  const db = getDB();
  
  // First verify this enrollment belongs to one of the employer's positions
  db.get(
    `SELECT ce.* FROM coop_enrollments ce
     JOIN positions p ON ce.position_id = p.position_id
     WHERE ce.enrollment_id = ? AND p.employer_id = ?`,
    [enrollmentId, req.user.id],
    (err, enrollment) => {
      if (err) {
        console.error('Verification error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (!enrollment) {
        return res.status(404).json({ error: 'Enrollment not found or not authorized' });
      }
      
      // Insert the comment
      db.run(
        `INSERT INTO employer_comments (enrollment_id, employer_id, comment_text)
         VALUES (?, ?, ?)`,
        [enrollmentId, req.user.id, comment_text.trim()],
        function(insertErr) {
          if (insertErr) {
            console.error('Insert error:', insertErr);
            return res.status(500).json({ error: 'Error saving comment: ' + insertErr.message });
          }
          res.status(201).json({ 
            message: 'Comment added successfully',
            comment_id: this.lastID
          });
        }
      );
    }
  );
});

// Get comments for a specific enrollment
router.get('/coop-students/:enrollmentId/comments', authenticateToken, requireRole('employer'), (req, res) => {
  const enrollmentId = req.params.enrollmentId;
  const db = getDB();
  
  // Verify ownership first
  db.get(
    `SELECT ce.* FROM coop_enrollments ce
     JOIN positions p ON ce.position_id = p.position_id
     WHERE ce.enrollment_id = ? AND p.employer_id = ?`,
    [enrollmentId, req.user.id],
    (err, enrollment) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!enrollment) {
        return res.status(404).json({ error: 'Enrollment not found or not authorized' });
      }
      
      db.all(
        'SELECT * FROM employer_comments WHERE enrollment_id = ? ORDER BY created_at DESC',
        [enrollmentId],
        (commentsErr, comments) => {
          if (commentsErr) {
            console.error('Comments fetch error:', commentsErr);
            return res.status(500).json({ error: 'Error fetching comments' });
          }
          res.json(comments || []);
        }
      );
    }
  );
});

module.exports = router;