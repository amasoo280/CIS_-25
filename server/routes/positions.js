const express = require('express');
const { getDB } = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { checkCoopEligibility } = require('../services/eligibilityService');
const { sendEligibilityNotification } = require('../services/emailService');

const router = express.Router();

// Get all positions (with optional filters)
router.get('/', (req, res) => {
  const { employer_name, location, major, skills, status } = req.query;
  const db = getDB();

  let query = `
    SELECT p.*, e.company_name, e.location as employer_location
    FROM positions p
    JOIN employers e ON p.employer_id = e.employer_id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND p.status = ?';
    params.push(status);
  }

  if (employer_name) {
    query += ' AND e.company_name LIKE ?';
    params.push(`%${employer_name}%`);
  }

  if (location) {
    query += ' AND (p.job_location LIKE ? OR p.job_location = ?)';
    params.push(`%${location}%`, location);
  }

  if (major) {
    query += ' AND p.majors_of_interest LIKE ?';
    params.push(`%${major}%`);
  }

  if (skills) {
    query += ' AND (p.required_skills LIKE ? OR p.preferred_skills LIKE ?)';
    params.push(`%${skills}%`, `%${skills}%`);
  }

  query += ' ORDER BY p.created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get single position
router.get('/:id', (req, res) => {
  const db = getDB();
  db.get(
    `SELECT p.*, e.company_name, e.location as employer_location, e.website, e.contact_name, e.contact_email, e.contact_phone
     FROM positions p
     JOIN employers e ON p.employer_id = e.employer_id
     WHERE p.position_id = ?`,
    [req.params.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Position not found' });
      }
      res.json(row);
    }
  );
});

// Create position (employer only)
router.post('/', authenticateToken, requireRole('employer'), (req, res) => {
  const {
    job_title,
    job_description,
    number_of_weeks,
    hours_per_week,
    job_location,
    majors_of_interest,
    required_skills,
    preferred_skills,
    salary_info
  } = req.body;

  if (!job_title || !job_description || !number_of_weeks || !hours_per_week || !job_location || !majors_of_interest) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const db = getDB();
  db.run(
    `INSERT INTO positions (employer_id, job_title, job_description, number_of_weeks, hours_per_week, 
     job_location, majors_of_interest, required_skills, preferred_skills, salary_info, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')`,
    [req.user.id, job_title, job_description, number_of_weeks, hours_per_week, job_location, 
     majors_of_interest, required_skills || null, preferred_skills || null, salary_info || null],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({
        position_id: this.lastID,
        message: 'Position created successfully'
      });
    }
  );
});

// Update position (employer only)
router.put('/:id', authenticateToken, requireRole('employer'), (req, res) => {
  const {
    job_title,
    job_description,
    number_of_weeks,
    hours_per_week,
    job_location,
    majors_of_interest,
    required_skills,
    preferred_skills,
    salary_info,
    status
  } = req.body;

  const db = getDB();

  // First verify ownership
  db.get('SELECT employer_id FROM positions WHERE position_id = ?', [req.params.id], (err, position) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!position) {
      return res.status(404).json({ error: 'Position not found' });
    }
    if (position.employer_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this position' });
    }

    db.run(
      `UPDATE positions 
       SET job_title = ?, job_description = ?, number_of_weeks = ?, hours_per_week = ?, 
           job_location = ?, majors_of_interest = ?, required_skills = ?, preferred_skills = ?, 
           salary_info = ?, status = ?
       WHERE position_id = ?`,
      [job_title, job_description, number_of_weeks, hours_per_week, job_location, 
       majors_of_interest, required_skills, preferred_skills, salary_info, status, req.params.id],
      function(updateErr) {
        if (updateErr) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Position updated successfully' });
      }
    );
  });
});

// Get positions by employer
router.get('/employer/my-positions', authenticateToken, requireRole('employer'), (req, res) => {
  const db = getDB();
  db.all(
    'SELECT * FROM positions WHERE employer_id = ? ORDER BY created_at DESC',
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

// Select student for position and check eligibility
router.post('/:id/select-student', authenticateToken, requireRole('employer'), async (req, res) => {
  const { student_id, offer_letter_path } = req.body;
  const positionId = req.params.id;

  if (!student_id) {
    return res.status(400).json({ error: 'Student ID is required' });
  }

  const db = getDB();

  // Verify position ownership
  db.get('SELECT * FROM positions WHERE position_id = ? AND employer_id = ?', 
    [positionId, req.user.id], 
    async (err, position) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!position) {
        return res.status(404).json({ error: 'Position not found or not authorized' });
      }

      // Get student info
      db.get('SELECT * FROM students WHERE student_id = ?', [student_id], async (err, student) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (!student) {
          return res.status(404).json({ error: 'Student not found' });
        }

        // Check eligibility
        const eligibility = checkCoopEligibility(student, position);

        // Update position status and selected student
        db.run(
          `UPDATE positions 
           SET status = 'pending', selected_student_id = ?, offer_letter_path = ?
           WHERE position_id = ?`,
          [student_id, offer_letter_path || null, positionId],
          function(updateErr) {
            if (updateErr) {
              return res.status(500).json({ error: 'Database error' });
            }

            // Update application status
            db.run(
              'UPDATE applications SET status = ? WHERE student_id = ? AND position_id = ?',
              ['selected', student_id, positionId]
            );

            // Create or update co-op enrollment record
            db.run(
              `INSERT OR REPLACE INTO coop_enrollments 
               (student_id, position_id, eligibility_result, eligibility_reason, department)
               VALUES (?, ?, ?, ?, ?)`,
              [student_id, positionId, eligibility.eligible ? 'eligible' : 'ineligible', 
               eligibility.reason, student.department],
              async function(enrollErr) {
                if (enrollErr) {
                  console.error('Error creating enrollment:', enrollErr);
                }

                // If eligible, send notification
                if (eligibility.eligible) {
                  try {
                    await sendEligibilityNotification(
                      student.email,
                      student.full_name,
                      position.job_title,
                      'Company' // Could fetch employer name if needed
                    );
                  } catch (emailErr) {
                    console.error('Error sending email:', emailErr);
                  }
                }

                res.json({
                  message: 'Student selected successfully',
                  eligibility: eligibility,
                  enrollment_id: this.lastID
                });
              }
            );
          }
        );
      });
    }
  );
});

module.exports = router;

