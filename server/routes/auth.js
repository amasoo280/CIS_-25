const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../database/db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'coop-portal-secret-key-2025';

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required' });
    }

    const db = getDB();
    let user = null;
    let tableName = '';

    // Determine which table to query based on role
    switch (role) {
      case 'student':
        tableName = 'students';
        break;
      case 'employer':
        tableName = 'employers';
        break;
      case 'faculty':
        tableName = 'faculty';
        break;
      default:
        return res.status(400).json({ error: 'Invalid role' });
    }

    // Query user from appropriate table
    // Employers use contact_email, others use email
    const emailField = role === 'employer' ? 'contact_email' : 'email';
    const query = `SELECT * FROM ${tableName} WHERE ${emailField} = ?`;
    
    db.get(query, [email], async (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error: ' + err.message });
      }

      if (!row) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, row.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const userIdField = role === 'student' ? 'student_id' : role === 'employer' ? 'employer_id' : 'faculty_id';
      const userEmail = role === 'employer' ? row.contact_email : row.email;
      const token = jwt.sign(
        {
          id: row[userIdField],
          email: userEmail,
          role: role
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Return user info (without password)
      const userInfo = { ...row };
      delete userInfo.password_hash;
      // For employers, also include email field for consistency
      if (role === 'employer') {
        userInfo.email = row.contact_email;
      }

      res.json({
        token,
        user: userInfo,
        role: role
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Register student
router.post('/register/student', async (req, res) => {
  try {
    const {
      full_name,
      email,
      phone,
      department,
      major,
      credit_hours,
      gpa,
      semester_started,
      is_transfer,
      password
    } = req.body;

    if (!full_name || !email || !department || !major || !credit_hours || !gpa || !semester_started || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = getDB();
    const passwordHash = await bcrypt.hash(password, 10);

    db.run(
      `INSERT INTO students (full_name, email, phone, department, major, credit_hours, gpa, semester_started, is_transfer, password_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [full_name, email, phone || null, department, major, credit_hours, gpa, semester_started, is_transfer ? 1 : 0, passwordHash],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint')) {
            return res.status(400).json({ error: 'Email already registered' });
          }
          return res.status(500).json({ error: 'Database error' });
        }

        // Generate token
        const token = jwt.sign(
          {
            id: this.lastID,
            email: email,
            role: 'student'
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.status(201).json({
          token,
          user: {
            student_id: this.lastID,
            full_name,
            email,
            phone,
            department,
            major,
            credit_hours,
            gpa,
            semester_started,
            is_transfer: is_transfer ? 1 : 0
          },
          role: 'student'
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Register employer
router.post('/register/employer', async (req, res) => {
  try {
    const {
      company_name,
      location,
      website,
      contact_name,
      contact_email,
      contact_phone,
      password
    } = req.body;

    if (!company_name || !location || !contact_name || !contact_email || !contact_phone || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = getDB();
    const passwordHash = await bcrypt.hash(password, 10);

    db.run(
      `INSERT INTO employers (company_name, location, website, contact_name, contact_email, contact_phone, password_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [company_name, location, website || null, contact_name, contact_email, contact_phone, passwordHash],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint')) {
            return res.status(400).json({ error: 'Email already registered' });
          }
          return res.status(500).json({ error: 'Database error' });
        }

        // Generate token
        const token = jwt.sign(
          {
            id: this.lastID,
            email: contact_email,
            role: 'employer'
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.status(201).json({
          token,
          user: {
            employer_id: this.lastID,
            company_name,
            location,
            website,
            contact_name,
            contact_email,
            contact_phone
          },
          role: 'employer'
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

