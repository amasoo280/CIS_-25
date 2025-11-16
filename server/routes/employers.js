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

module.exports = router;

